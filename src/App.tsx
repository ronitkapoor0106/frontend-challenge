import { useEffect, useMemo, useState } from "react"
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Nav from "./components/Nav"
import Courses from "./components/Courses"
import Cart from "./components/Cart"
import Checkout from "./pages/Checkout"
import coursesData from "./data/courses.json"
import { Course, getCourseId } from "./types"

const courses = coursesData as Course[]
const cartLimit = 7

type ScheduleMeeting = {
	id: string
	day: "M" | "T" | "W" | "R" | "F"
	startMinutes: number
	endMinutes: number
	label: string
}

const toCourseFromApi = (payload: any): Course | null => {
	if (!payload?.id || !payload?.title) return null
	const [dept, numberText] = String(payload.id).split("-")
	const number = Number.parseInt(numberText, 10)
	if (!dept || !Number.isFinite(number)) return null
	const prereqs =
		typeof payload.prerequisites === "string" && payload.prerequisites.trim().length > 0
			? payload.prerequisites.trim()
			: undefined
	const crossListed =
		Array.isArray(payload.crosslistings) && payload.crosslistings.length > 0
			? payload.crosslistings.map((value: string) => value.trim()).filter(Boolean)
			: undefined

	return {
		dept,
		number,
		title: payload.title,
		description: payload.description ?? "",
		prereqs,
		"cross-listed": crossListed,
	}
}

const mergeCourses = (apiCourses: Course[], localCourses: Course[]) => {
	const courseMap = new Map<string, Course>()

	apiCourses.forEach((course) => {
		courseMap.set(getCourseId(course), course)
	})

	localCourses.forEach((course) => {
		const courseId = getCourseId(course)
		const apiCourse = courseMap.get(courseId)
		courseMap.set(courseId, {
			...apiCourse,
			...course,
			description: apiCourse?.description?.trim() ? apiCourse.description : course.description,
		})
	})

	return Array.from(courseMap.values())
}

const parseMinutesFromTime = (value: number) => {
	const hours = Math.floor(value)
	const minutes = Math.round((value - hours) * 100)
	return hours * 60 + minutes
}

const extractScheduleMeetings = (payload: any): ScheduleMeeting[] => {
	if (!payload?.sections || !Array.isArray(payload.sections)) return []
	const sections = payload.sections
	const primarySection =
		sections.find((section: any) => section.activity === "LEC") ??
		sections.find((section: any) => section.activity === "SEM") ??
		sections[0]

	if (!primarySection?.meetings) return []

	return primarySection.meetings
		.filter((meeting: any) => meeting.day && meeting.start && meeting.end)
		.map((meeting: any, index: number) => ({
			id: `${payload.id}-${index}`,
			day: meeting.day,
			startMinutes: parseMinutesFromTime(meeting.start),
			endMinutes: parseMinutesFromTime(meeting.end),
			label: payload.id,
		}))
}

const AppShell = () => {
	const [cartIds, setCartIds] = useState<string[]>([])
	const [isCartOpen, setIsCartOpen] = useState(false)
	const [cartNotice, setCartNotice] = useState<string | null>(null)
	const [term, setTerm] = useState("2022A")
	const [loadAllCourses, setLoadAllCourses] = useState(false)
	const [apiCourses, setApiCourses] = useState<Course[]>([])
	const [coursesError, setCoursesError] = useState<string | null>(null)
	const [isLoadingCourses, setIsLoadingCourses] = useState(false)
	const [scheduleMeetings, setScheduleMeetings] = useState<ScheduleMeeting[]>([])
	const navigate = useNavigate()
	const location = useLocation()

	useEffect(() => {
		const controller = new AbortController()

		const loadCourses = async () => {
			if (!loadAllCourses) {
				setApiCourses([])
				setCoursesError(null)
				setIsLoadingCourses(false)
				return
			}

			setIsLoadingCourses(true)
			setCoursesError(null)
			try {
				const timeoutId = setTimeout(() => controller.abort(), 8000)
				const response = await fetch(`/api/base/${term}/courses/`, {
					signal: controller.signal,
				})
				clearTimeout(timeoutId)
				if (!response.ok) {
					throw new Error("Unable to load courses for that term.")
				}
				const payload = await response.json()
				if (!Array.isArray(payload)) {
					throw new Error("Unexpected course response.")
				}
				const mapped = payload
					.map((item) => toCourseFromApi(item))
					.filter((course): course is Course => Boolean(course))
				setApiCourses(mapped)
			} catch (error) {
				const isAbort = (error as Error).name === "AbortError"
				const message = isAbort
					? "Full catalog request timed out. Use search instead."
					: "Full catalog request failed. Use search instead."
				setCoursesError(message)
				setLoadAllCourses(false)
			} finally {
				setIsLoadingCourses(false)
			}
		}

		loadCourses()

		return () => controller.abort()
	}, [term, loadAllCourses])

	const allCourses = useMemo(() => {
		if (loadAllCourses && apiCourses.length > 0) return mergeCourses(apiCourses, courses)
		if (loadAllCourses && isLoadingCourses) return []
		if (loadAllCourses && coursesError) return courses
		return courses
	}, [apiCourses, isLoadingCourses, coursesError, loadAllCourses])

	useEffect(() => {
		let isMounted = true

		const loadMeetings = async () => {
			if (cartIds.length === 0) {
				if (isMounted) setScheduleMeetings([])
				return
			}

			const results: ScheduleMeeting[] = []
			for (const courseId of cartIds) {
				try {
					const response = await fetch(`/api/base/${term}/courses/${courseId}/`)
					if (!response.ok) continue
					const payload = await response.json()
					results.push(...extractScheduleMeetings(payload))
				} catch (error) {
					// ignore schedule errors for now
				}
			}

			if (isMounted) {
				setScheduleMeetings(results)
			}
		}

		loadMeetings()

		return () => {
			isMounted = false
		}
	}, [cartIds, term])

	const cartCourses = useMemo(
		() =>
			cartIds
				.map((id) => allCourses.find((course) => getCourseId(course) === id))
				.filter(Boolean) as Course[],
		[cartIds, allCourses]
	)

	const handleAddCourse = (course: Course) => {
		const courseId = getCourseId(course)
		if (cartIds.includes(courseId)) return
		if (cartIds.length >= cartLimit) {
			setCartNotice("Cart limit reached. Remove a course to add another.")
			return
		}
		setCartNotice(null)
		setCartIds((prev) => [...prev, courseId])
	}

	const handleRemoveCourse = (course: Course) => {
		const courseId = getCourseId(course)
		setCartIds((prev) => prev.filter((id) => id !== courseId))
		setCartNotice(null)
	}

	const handleCheckout = () => {
		const query = cartIds.join(",")
		setIsCartOpen(false)
		navigate(`/checkout?courses=${encodeURIComponent(query)}`)
	}

	const handleReorderCart = (fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex) return
		setCartIds((prev) => {
			const next = [...prev]
			const [moved] = next.splice(fromIndex, 1)
			next.splice(toIndex, 0, moved)
			return next
		})
	}

	const isCheckoutPage = location.pathname === "/checkout"

	return (
		<div className="app">
			<Nav cartCount={cartIds.length} onToggleCart={() => setIsCartOpen((prev) => !prev)} />
			<main className="app__content">
				<Routes>
					<Route
						path="/"
						element={
							<Courses
								courses={allCourses}
								cartIds={cartIds}
								cartCourses={cartCourses}
								scheduleMeetings={scheduleMeetings}
								onAdd={handleAddCourse}
								onRemove={handleRemoveCourse}
								cartLimit={cartLimit}
								cartNotice={cartNotice}
								term={term}
								onTermChange={setTerm}
				loadAllCourses={loadAllCourses}
				onToggleLoadAll={() => setLoadAllCourses((prev) => !prev)}
								isLoadingCourses={isLoadingCourses}
								coursesError={coursesError}
							/>
						}
					/>
					<Route path="/checkout" element={<Checkout courses={allCourses} />} />
				</Routes>
			</main>
			{!isCheckoutPage && (
				<Cart
					isOpen={isCartOpen}
					onClose={() => setIsCartOpen(false)}
					cartCourses={cartCourses}
					onRemove={handleRemoveCourse}
					onCheckout={handleCheckout}
					onReorder={handleReorderCart}
					shareUrl={`${window.location.origin}/checkout?courses=${encodeURIComponent(cartIds.join(","))}`}
					cartLimit={cartLimit}
				/>
			)}
		</div>
	)
}

function App() {
	return (
		<BrowserRouter>
			<AppShell />
		</BrowserRouter>
	)
}

export default App
