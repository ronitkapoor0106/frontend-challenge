import { useState } from "react"
import { Course, getCourseId } from "../types"

type CartProps = {
	isOpen: boolean
	onClose: () => void
	cartCourses: Course[]
	onRemove: (course: Course) => void
	onCheckout: () => void
	onReorder: (fromIndex: number, toIndex: number) => void
	shareUrl: string
	cartLimit: number
}

const Cart = ({
	isOpen,
	onClose,
	cartCourses,
	onRemove,
	onCheckout,
	onReorder,
	shareUrl,
	cartLimit,
}: CartProps) => {
	const [dragIndex, setDragIndex] = useState<number | null>(null)
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			setCopied(false)
		}
	}

	return (
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
						<p className="cart__hint">Drag courses to rank your preferences.</p>
						<ul className="cart__list">
							{cartCourses.map((course, index) => (
								<li
									key={getCourseId(course)}
									className={`cart__item ${dragIndex === index ? "cart__item--dragging" : ""}`}
									draggable
									onDragStart={() => setDragIndex(index)}
									onDragEnd={() => setDragIndex(null)}
									onDragOver={(event) => event.preventDefault()}
									onDrop={() => {
										if (dragIndex === null) return
										onReorder(dragIndex, index)
										setDragIndex(null)
									}}>
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
							<button className="button button--ghost" onClick={handleCopy}>
								{copied ? "Link copied" : "Share cart link"}
							</button>
							<button className="button button--primary" onClick={onCheckout}>
								Checkout courses
							</button>
						</div>
					</>
				)}
			</aside>
		</>
	)
}

export default Cart
