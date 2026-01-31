import { Link, useLocation } from "react-router-dom"
import { Course, getCourseId } from "../types"

type CheckoutProps = {
	courses: Course[]
}

const Checkout = ({ courses }: CheckoutProps) => {
	const location = useLocation()
	const searchParams = new URLSearchParams(location.search)
	const courseParam = searchParams.get("courses") ?? ""
	const courseIds = courseParam.split(",").map((value) => value.trim()).filter(Boolean)
	const selectedCourses = courseIds
		.map((id) => courses.find((course) => getCourseId(course) === id))
		.filter((course): course is Course => Boolean(course))

	return (
		<div className="checkout">
			<div className="checkout__header">
				<div>
					<h2>Checkout receipt</h2>
					<p className="checkout__subtitle">Your confirmed courses are listed below.</p>
				</div>
				<Link to="/" className="button button--ghost">
					Back to catalog
				</Link>
			</div>
			<div className="checkout__card">
				{selectedCourses.length === 0 ? (
					<div className="checkout__empty">
						<p>No courses were found for this receipt.</p>
						<p>Return to the catalog to add courses before checkout.</p>
					</div>
				) : (
					<>
						<ul className="checkout__list">
							{selectedCourses.map((course) => (
								<li key={getCourseId(course)} className="checkout__item">
									<div>
										<p className="checkout__code">
											{course.dept} {course.number}
										</p>
										<p className="checkout__title">{course.title}</p>
										<p className="checkout__description">{course.description}</p>
									</div>
									<span className="tag">Confirmed</span>
								</li>
							))}
						</ul>
						<p className="checkout__footer">Total courses: {selectedCourses.length}</p>
					</>
				)}
			</div>
		</div>
	)
}

export default Checkout
