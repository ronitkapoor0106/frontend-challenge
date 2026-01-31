import React, { useEffect, useMemo, useState } from "react"
import { Course, getCourseId } from "../types"

type CoursesProps = {
	courses: Course[]
	cartIds: string[]
	cartCourses: Course[]
	scheduleMeetings: ScheduleMeeting[]
	onAdd: (course: Course) => void
	onRemove: (course: Course) => void
	cartLimit: number
	cartNotice?: string | null
	term: string
	onTermChange: (term: string) => void
	isLoadingCourses: boolean
	coursesError?: string | null
}

const seatHistory = [
	{ label: "Adv", seats: 0.15, waitlist: 0.05 },
	{ label: "Add 1", seats: 0.35, waitlist: 0.08 },
	{ label: "Add 2", seats: 0.55, waitlist: 0.12 },
	{ label: "Add 3", seats: 0.72, waitlist: 0.18 },
	{ label: "Add 4", seats: 0.82, waitlist: 0.26 },
	{ label: "Add 5", seats: 0.88, waitlist: 0.33 },
	{ label: "Add 6", seats: 0.91, waitlist: 0.29 },
	{ label: "Drop", seats: 0.78, waitlist: 0.14 },
]

type ScheduleMeeting = {
	id: string
	day: "M" | "T" | "W" | "R" | "F"
	startMinutes: number
	endMinutes: number
	label: string
}

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const dayKeys: Array<ScheduleMeeting["day"]> = ["M", "T", "W", "R", "F"]
const scheduleStartHour = 8
const scheduleEndHour = 18
const minutesPerSlot = 30
const scheduleStartMinutes = scheduleStartHour * 60
const scheduleEndMinutes = scheduleEndHour * 60
const timeSlots = Array.from({ length: scheduleEndHour - scheduleStartHour }, (_, i) => {
	const hour = scheduleStartHour + i
	const labelHour = hour > 12 ? hour - 12 : hour
	const suffix = hour >= 12 ? "PM" : "AM"
	return `${labelHour} ${suffix}`
})

const SeatTrendChart = () => {
	const width = 240
	const height = 120
	const padding = 12
	const xStep = (width - padding * 2) / (seatHistory.length - 1)
	const yFor = (value: number) => height - padding - value * (height - padding * 2)

	const seatPoints = seatHistory
		.map((point, index) => `${padding + index * xStep},${yFor(point.seats)}`)
		.join(" ")
	const waitPoints = seatHistory
		.map((point, index) => `${padding + index * xStep},${yFor(point.waitlist)}`)
		.join(" ")

	return (
		<div className="seat-chart">
			<div className="seat-chart__header">
				<p>Seats & waitlist trend</p>
				<div className="seat-chart__legend">
					<span className="seat-chart__dot seat-chart__dot--seats" /> Seats filled
					<span className="seat-chart__dot seat-chart__dot--waitlist" /> Waitlist
				</div>
			</div>
			<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Seat history trend">
				<polyline className="seat-chart__line seat-chart__line--grid" points={`${padding},${height - padding} ${width - padding},${height - padding}`} />
				<polyline className="seat-chart__line seat-chart__line--waitlist" points={waitPoints} />
				<polyline className="seat-chart__line seat-chart__line--seats" points={seatPoints} />
			</svg>
			<div className="seat-chart__labels">
				{seatHistory.map((point) => (
					<span key={point.label}>{point.label}</span>
				))}
			</div>
		</div>
	)
}

const Courses = ({
	courses,
	cartIds,
	cartCourses,
	scheduleMeetings,
	onAdd,
	onRemove,
	cartLimit,
	cartNotice,
	term,
	onTermChange,
	isLoadingCourses,
	coursesError,
}: CoursesProps) => {
	const [searchText, setSearchText] = useState("")
	const [minNumber, setMinNumber] = useState("")
	const [maxNumber, setMaxNumber] = useState("")
	const [activeCourse, setActiveCourse] = useState<Course | null>(null)
	const [isScheduleOpen, setIsScheduleOpen] = useState(false)
	const [page, setPage] = useState(1)
	const pageSize = 24

	const filteredCourses = useMemo(() => {
		const normalizedSearch = searchText.trim().toLowerCase()
		const parsedMin = minNumber.trim() ? Number(minNumber) : undefined
		const parsedMax = maxNumber.trim() ? Number(maxNumber) : undefined
		const minValue = parsedMin !== undefined && Number.isFinite(parsedMin) ? parsedMin : undefined
		const maxValue = parsedMax !== undefined && Number.isFinite(parsedMax) ? parsedMax : undefined

		return courses.filter((course) => {
			const courseCode = `${course.dept} ${course.number}`.toLowerCase()
			const dashedCode = `${course.dept}-${course.number}`.toLowerCase()
			const matchesSearch =
				normalizedSearch.length === 0 ||
				course.title.toLowerCase().includes(normalizedSearch) ||
				course.description.toLowerCase().includes(normalizedSearch) ||
				course.dept.toLowerCase().includes(normalizedSearch) ||
				courseCode.includes(normalizedSearch) ||
				dashedCode.includes(normalizedSearch)

			const matchesMin = minValue === undefined || course.number >= minValue
			const matchesMax = maxValue === undefined || course.number <= maxValue

			return matchesSearch && matchesMin && matchesMax
		})
	}, [courses, searchText, minNumber, maxNumber])

	const sortedCourses = useMemo(() => {
		return [...filteredCourses].sort((a, b) => {
			const deptCompare = a.dept.localeCompare(b.dept)
			if (deptCompare !== 0) return deptCompare
			if (a.number !== b.number) return a.number - b.number
			return a.title.localeCompare(b.title)
		})
	}, [filteredCourses])

	useEffect(() => {
		setPage(1)
	}, [searchText, minNumber, maxNumber, courses])

	const totalPages = Math.max(1, Math.ceil(sortedCourses.length / pageSize))
	const safePage = Math.min(page, totalPages)
	const pagedCourses = useMemo(() => {
		const startIndex = (safePage - 1) * pageSize
		return sortedCourses.slice(startIndex, startIndex + pageSize)
	}, [sortedCourses, safePage])

	const cartCount = cartIds.length
	const isCartFull = cartCount >= cartLimit

	const handleOpenDetails = (course: Course) => {
		setActiveCourse(course)
	}

	const handleCloseDetails = () => {
		setActiveCourse(null)
	}

	const handleAddFromModal = (course: Course) => {
		onAdd(course)
		setActiveCourse(null)
	}

	return (
		<div className="courses">
			<aside className="filters">
				<div className="filters__section">
					<label className="input">
						<span>Search courses</span>
						<input
							type="search"
							placeholder="Search by title or description"
							value={searchText}
							onChange={(event) => setSearchText(event.target.value)}
						/>
					</label>
				</div>
				<div className="filters__section">
					<p className="filters__title">Filter by number</p>
					<div className="filters__row">
						<label className="input">
							<span>Min</span>
							<input
								type="number"
								inputMode="numeric"
								placeholder="100"
								value={minNumber}
								onChange={(event) => setMinNumber(event.target.value)}
							/>
						</label>
						<label className="input">
							<span>Max</span>
							<input
								type="number"
								inputMode="numeric"
								placeholder="499"
								value={maxNumber}
								onChange={(event) => setMaxNumber(event.target.value)}
							/>
						</label>
					</div>
					{(minNumber || maxNumber || searchText) && (
						<button
							className="button button--ghost button--small"
							onClick={() => {
								setMinNumber("")
								setMaxNumber("")
								setSearchText("")
							}}>
							Clear filters
						</button>
					)}
				</div>
				<div className="filters__section">
					<p className="filters__summary">
						<span>{sortedCourses.length}</span> courses match
					</p>
					{cartNotice && <p className="filters__notice">{cartNotice}</p>}
					<p className="filters__caption">Cart limit: {cartCount}/{cartLimit}</p>
				</div>
				<div className="filters__section">
					<p className="filters__title">Course catalog</p>
					<label className="input">
						<span>Term</span>
						<input
							type="text"
							placeholder="2022A"
							value={term}
							onChange={(event) => onTermChange(event.target.value)}
						/>
					</label>
					{isLoadingCourses ? (
						<p className="filters__caption">Loading PennCoursePlan courses...</p>
					) : (
						<p className="filters__caption">
							Browsing {courses.length} courses from PennCoursePlan.
						</p>
					)}
					{coursesError && <p className="filters__notice">{coursesError}</p>}
				</div>
				<div className="filters__section">
					<h4 className="filters__title">Schedule planner</h4>
					<div className="schedule">
						{cartCourses.length === 0 ? (
							<p className="schedule__empty">Add courses to preview a schedule.</p>
						) : (
							<>
								<div
									className="schedule__grid schedule__grid--compact"
									style={{ gridTemplateRows: `24px repeat(${timeSlots.length}, 32px)` }}>
									<div className="schedule__corner" />
									{dayLabels.map((day, index) => (
										<div
											key={day}
											className="schedule__day"
											style={{ gridColumn: index + 2, gridRow: 1 }}>
											{day}
										</div>
									))}
									{timeSlots.map((time, index) => (
										<div
											key={time}
											className="schedule__time"
											style={{ gridColumn: 1, gridRow: index + 2 }}>
											{time}
										</div>
									))}
									{scheduleMeetings
										.filter(
											(meeting) =>
												meeting.startMinutes >= scheduleStartMinutes &&
												meeting.endMinutes <= scheduleEndMinutes
										)
										.map((meeting) => {
											const dayIndex = dayKeys.indexOf(meeting.day)
											if (dayIndex === -1) return null
											const rowStart =
												Math.floor((meeting.startMinutes - scheduleStartMinutes) / minutesPerSlot) + 2
											const rowSpan = Math.max(
												1,
												Math.ceil((meeting.endMinutes - meeting.startMinutes) / minutesPerSlot)
											)

											return (
												<div
													key={meeting.id}
													className="schedule__block schedule__block--compact"
													style={{
														gridColumn: `${dayIndex + 2} / span 1`,
														gridRow: `${rowStart} / span ${rowSpan}`,
													}}
												/>
											)
										})}
								</div>
								<button
									className="button button--ghost button--small schedule__button"
									onClick={() => setIsScheduleOpen(true)}>
									Open schedule
								</button>
							</>
						)}
					</div>
				</div>
			</aside>
			<section>
				<div className="course-grid__meta">
					<p className="filters__summary">
						Showing {sortedCourses.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
						{Math.min(safePage * pageSize, sortedCourses.length)} of {sortedCourses.length}
					</p>
					<div className="pagination">
						<button
							className="button button--ghost button--small"
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							disabled={safePage === 1}>
							Prev
						</button>
						<span className="pagination__label">
							Page {safePage} of {totalPages}
						</span>
						<button
							className="button button--ghost button--small"
							onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
							disabled={safePage === totalPages}>
							Next
						</button>
					</div>
				</div>
				<div className="course-grid">
					{pagedCourses.length === 0 ? (
						<p className="filters__caption">No courses match your filters.</p>
					) : (
						pagedCourses.map((course) => {
							const courseId = getCourseId(course)
							const isInCart = cartIds.includes(courseId)

							return (
								<article
									key={courseId}
									className={`course-card ${isInCart ? "course-card--selected" : ""}`}>
									<div className="course-card__header">
										<div>
											<p className="course-card__code">
												{course.dept} {course.number}
											</p>
											<h3 className="course-card__title">{course.title}</h3>
										</div>
										{isInCart && <span className="tag tag--primary">In cart</span>}
									</div>
									<div className="course-card__actions">
										<button
											className="button button--ghost button--small"
											onClick={() => handleOpenDetails(course)}>
											Show details
										</button>
										{isInCart ? (
											<button className="button button--outline" onClick={() => onRemove(course)}>
												Remove
											</button>
										) : (
											<button
												className="button button--primary"
												disabled={isCartFull}
												onClick={() => onAdd(course)}>
												{isCartFull ? "Cart full" : "Add to cart"}
											</button>
										)}
									</div>
								</article>
							)
						})
					)}
				</div>
			</section>
			{activeCourse && (
				<>
					<div className="modal-backdrop" onClick={handleCloseDetails} />
					<div className="modal">
						<div className="modal__header">
							<div>
								<p className="modal__code">
									{activeCourse.dept} {activeCourse.number}
								</p>
								<h3 className="modal__title">{activeCourse.title}</h3>
							</div>
							<div className="modal__actions">
								{cartIds.includes(getCourseId(activeCourse)) ? (
									<button className="button button--outline" onClick={() => onRemove(activeCourse)}>
										Remove
									</button>
								) : (
									<button
										className="button button--primary"
										disabled={isCartFull}
										onClick={() => handleAddFromModal(activeCourse)}>
										{isCartFull ? "Cart full" : "Add to cart"}
									</button>
								)}
								<button className="button button--ghost button--small" onClick={handleCloseDetails}>
									Close
								</button>
							</div>
						</div>
						<div className="modal__body">
							<div className="modal__content">
								<p>
									<strong>Description:</strong> {activeCourse.description}
								</p>
								{activeCourse.prereqs && (
									<p>
										<strong>Prerequisites:</strong>{" "}
										{Array.isArray(activeCourse.prereqs)
											? activeCourse.prereqs.join(", ")
											: activeCourse.prereqs}
									</p>
								)}
								{activeCourse["cross-listed"] && activeCourse["cross-listed"]!.length > 0 && (
									<p>
										<strong>Cross-listed:</strong> {activeCourse["cross-listed"]!.join(", ")}
									</p>
								)}
							</div>
							<SeatTrendChart />
						</div>
					</div>
				</>
			)}
			{isScheduleOpen && (
				<>
					<div className="modal-backdrop" onClick={() => setIsScheduleOpen(false)} />
					<div className="modal modal--wide">
						<div className="modal__header">
							<div>
								<p className="modal__code">Schedule planner</p>
								<h3 className="modal__title">Weekly preview</h3>
							</div>
							<button
								className="button button--ghost button--small"
								onClick={() => setIsScheduleOpen(false)}>
								Close
							</button>
						</div>
						<div className="schedule schedule--modal">
							{cartCourses.length === 0 ? (
								<p className="schedule__empty">Add courses to preview a schedule.</p>
							) : (
								<div className="schedule__grid" style={{ gridTemplateRows: `28px repeat(${timeSlots.length}, 38px)` }}>
									<div className="schedule__corner" />
									{dayLabels.map((day, index) => (
										<div
											key={day}
											className="schedule__day"
											style={{ gridColumn: index + 2, gridRow: 1 }}>
											{day}
										</div>
									))}
									{timeSlots.map((time, index) => (
										<div
											key={time}
											className="schedule__time"
											style={{ gridColumn: 1, gridRow: index + 2 }}>
											{time}
										</div>
									))}
									{scheduleMeetings
										.filter(
											(meeting) =>
												meeting.startMinutes >= scheduleStartMinutes &&
												meeting.endMinutes <= scheduleEndMinutes
										)
										.map((meeting) => {
											const dayIndex = dayKeys.indexOf(meeting.day)
											if (dayIndex === -1) return null
											const rowStart =
												Math.floor((meeting.startMinutes - scheduleStartMinutes) / minutesPerSlot) + 2
											const rowSpan = Math.max(
												1,
												Math.ceil((meeting.endMinutes - meeting.startMinutes) / minutesPerSlot)
											)

											return (
												<div
													key={meeting.id}
													className="schedule__block"
													style={{
														gridColumn: `${dayIndex + 2} / span 1`,
														gridRow: `${rowStart} / span ${rowSpan}`,
													}}>
													{meeting.label}
												</div>
											)
										})}
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

export default Courses
