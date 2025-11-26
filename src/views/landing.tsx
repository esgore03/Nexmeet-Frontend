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
      <Hero />
    </>
  );
};

export default Landing;
