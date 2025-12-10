import Hero from "../components/Hero";

/**
 * Landing Page Component
 *
 * This component serves as the main entry point of the application’s landing page.
 * It renders the {@link Hero} component, which typically contains the introductory
 * section or hero banner of the site.
 *
 * @component
 * @example
 * // Example usage:
 * <Landing />
 *
 * @returns {JSX.Element} The rendered landing page.
 */
const Landing: React.FC = () => {
  return (
    <>
      {/* WCAG skip-link */}
      <a
        href="#main-landing-content"
        className="skip-link"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          background: '#2563eb',
          color: '#fff',
          padding: '8px 16px',
          zIndex: 999,
          transform: 'translateY(-120%)',
          transition: 'transform 0.3s',
        }}
        onFocus={e => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onBlur={e => {
          e.currentTarget.style.transform = 'translateY(-120%)';
        }}
      >
        Saltar al contenido principal
      </a>
      <div id="main-landing-content">
        <Hero />
      </div>
    </>
  );
};

export default Landing;
