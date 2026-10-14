import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import './Sculptures.css';

const products = [
  {
    id: 1,
    category: 'Tara',
    name: 'Green Tara',
    description: 'A finely handcrafted representation of Green Tara, symbolizing compassion, protection and liberation.',
    price: 'NPR 85,000',
    image: '/images/sculpture-1.jpg',
    alt: 'Handcrafted sacred metal sculpture',
  },
  {
    id: 2,
    category: 'Buddha',
    name: 'Shakyamuni Buddha',
    description: 'Traditional Nepalese metal sculpture crafted with attention to sacred form and fine ornamental detail.',
    price: 'NPR 95,000',
    image: '/images/sculpture-2.jpg',
    alt: 'Traditional Himalayan Buddha sculpture',
  },
  {
    id: 3,
    category: 'Deities',
    name: 'Chenrezig',
    description: 'A detailed sacred sculpture representing compassion and loving kindness.',
    price: 'NPR 120,000',
    image: '/images/sculpture-1.jpg',
    alt: 'Traditional sacred deity sculpture',
  },
  {
    id: 4,
    category: 'Tara',
    name: 'White Tara',
    description: 'A graceful handcrafted sculpture inspired by traditional Himalayan sacred art.',
    price: 'NPR 90,000',
    image: '/images/sculpture-2.jpg',
    alt: 'Handcrafted Himalayan sculpture',
  },
  {
    id: 5,
    category: 'Deities',
    name: 'Manjushri',
    description: 'Traditionally crafted with intricate detailing inspired by Kathmandu Valley metalwork.',
    price: 'NPR 110,000',
    image: '/images/sculpture-1.jpg',
    alt: 'Traditional Nepalese metalwork sculpture',
  },
  {
    id: 6,
    category: 'Buddha',
    name: 'Vajrasattva',
    description: 'A refined sacred sculpture representing purification and spiritual practice.',
    price: 'NPR 135,000',
    image: '/images/sculpture-2.jpg',
    alt: 'Sacred Buddha sculpture',
  },
];

const categories = ['All', 'Buddha', 'Tara', 'Deities', 'Others'];

export default function Sculptures() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    if (activeCategory === 'Others') return products.filter((product) => !['Buddha', 'Tara', 'Deities'].includes(product.category));
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="sculptures-page">
      <header className="sculptures-header">
        <Link to="/" className="logo">HIMALAYAN SACRED ARTS</Link>
        <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/">Home</Link>
          {isAuthenticated ? (
            <>
              <Link to="/profile">Account ({user?.name?.split(' ')[0] || 'Patron'})</Link>
              {isAdmin && <Link to="/admin" style={{ color: 'var(--gold-bright, #d9b45f)' }}>Admin</Link>}
            </>
          ) : (
            <>
              <Link to="/login">Sign In</Link>
              <Link to="/signup" style={{ border: '1px solid rgba(184, 137, 43, 0.4)', padding: '6px 14px' }}>Join</Link>
            </>
          )}
        </nav>
      </header>

      <section className="page-hero">
        <div className="page-hero-content">
          <div className="eyebrow">The Collection</div>
          <h1>Our Sculptures</h1>
          <p>
            Discover handcrafted sacred sculptures created by skilled artisans of the Kathmandu Valley,
            where centuries-old traditions continue through every piece.
          </p>
        </div>
      </section>

      <section className="collection">
        <div className="section-heading">
          <div className="eyebrow">Handcrafted in Nepal</div>
          <h2>Explore Our Collection</h2>
          <p>Each sculpture carries the artistry, devotion and heritage of Nepal.</p>
        </div>

        <div className="filters" aria-label="Filter sculptures by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`filter-btn${activeCategory === category ? ' active' : ''}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image} alt={product.alt} loading="lazy" />
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-bottom">
                  <span className="price">{product.price}</span>
                  <a className="view-btn" href={`mailto:info@himalayansacredarts.com?subject=${encodeURIComponent(`Enquiry about ${product.name}`)}`}>
                    INQUIRE
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" id="contact">
        <h2>Looking for Something Particular?</h2>
        <p>We also create custom sculptures according to traditional designs, proportions and requirements.</p>
        <a className="cta-btn" href="mailto:info@himalayansacredarts.com?subject=Custom%20sculpture%20enquiry">
          INQUIRE ABOUT A PIECE
        </a>
      </section>

      <footer id="footer">
        <p>© 2026 Himalayan Sacred Arts. Handcrafted in the Kathmandu Valley.</p>
      </footer>
    </div>
  );
}
