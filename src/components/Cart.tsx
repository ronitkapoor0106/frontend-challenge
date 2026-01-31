import { Course, getCourseId } from "../types"

type CartProps = {
	isOpen: boolean
	onClose: () => void
	cartCourses: Course[]
	onRemove: (course: Course) => void
	onCheckout: () => void
	cartLimit: number
}

const Cart = ({ isOpen, onClose, cartCourses, onRemove, onCheckout, cartLimit }: CartProps) => (
	<>
		<div className={`cart-backdrop ${isOpen ? "cart-backdrop--open" : ""}`} onClick={onClose} />
		<aside className={`cart ${isOpen ? "cart--open" : ""}`}>
			<div className="cart__header">
				<div>
					<h3>Course cart</h3>
					<p>
						{cartCourses.length} / {cartLimit} selected
					</p>
				</div>
				<button className="button button--ghost button--small" onClick={onClose}>
					Close
				</button>
			</div>
			{cartCourses.length === 0 ? (
				<div className="cart__empty">
					<p>Your cart is empty.</p>
					<p className="cart__empty-subtitle">Add up to {cartLimit} courses to checkout.</p>
				</div>
			) : (
				<>
					<ul className="cart__list">
						{cartCourses.map((course) => (
							<li key={getCourseId(course)} className="cart__item">
								<div>
									<p className="cart__item-code">
										{course.dept} {course.number}
									</p>
									<p className="cart__item-title">{course.title}</p>
								</div>
								<button className="button button--ghost button--small" onClick={() => onRemove(course)}>
									Remove
								</button>
							</li>
						))}
					</ul>
					<div className="cart__footer">
						<button className="button button--primary" onClick={onCheckout}>
							Checkout courses
						</button>
					</div>
				</>
			)}
		</aside>
	</>
)

export default Cart
