type NavProps = {
	cartCount: number
	onToggleCart: () => void
}

const Nav = ({ cartCount, onToggleCart }: NavProps) => (
	<header className="nav">
		<div className="nav__brand">
			<div className="nav__logo">P</div>
			<div>
				<p className="nav__title">Penn Course Cart</p>
				<p className="nav__subtitle">Explore CIS courses and build your cart</p>
			</div>
		</div>
		<div className="nav__actions">
			<button className="button button--ghost" onClick={onToggleCart}>
				View cart
				{cartCount > 0 && <span className="badge">{cartCount}</span>}
			</button>
		</div>
	</header>
)

export default Nav
