import { Link } from "react-router-dom";
import "./OverviewPage.css";
import sharkBackground from "../assets/sharky.jpg";

interface DatasetStatistics {
  totalPositions: number;
  uniqueSharks: number;
  femaleSharks: number;
  maleSharks: number;
  unknownSexSharks: number;
  earliestDate: Date | null;
  latestDate: Date | null;
}

interface OverviewPageProps {
  statistics: DatasetStatistics;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OverviewPage({ statistics }: OverviewPageProps) {
  const knownSexSharks = statistics.femaleSharks + statistics.maleSharks;

  const femalePercentage =
    knownSexSharks > 0 ? (statistics.femaleSharks / knownSexSharks) * 100 : 0;

  const malePercentage =
    knownSexSharks > 0 ? (statistics.maleSharks / knownSexSharks) * 100 : 0;

  return (
    <section className="overview-page">
      <header
        className="overview-hero"
        style={{
          backgroundImage: `linear-gradient(
      90deg,
        rgba(2, 15, 28, 0.94) 0%,
        rgba(3, 37, 56, 0.82) 55%,
        rgba(4, 71, 91, 0.72) 100%
    ), url(${sharkBackground})`,
        }}
      >
        <div>
          <p className="overview-eyebrow">Information Visualization Project</p>

          <h2>Interactive White Shark Tracking Explorer</h2>

          <p className="overview-introduction">
            Explore spatial and temporal observations of tagged white sharks
            using interactive maps, movement animation and comparative
            visualizations.
          </p>

          <div className="overview-actions">
            <Link className="primary-link" to="/map">
              Explore shark movements
            </Link>

            <Link className="secondary-link" to="/analysis">
              View data analysis
            </Link>
          </div>
        </div>
      </header>

      <section className="overview-section">
        <div className="section-heading">
          <h3>Dataset summary</h3>

          <p>
            An overview of the tagged sharks and tracking detections included in
            the dataset.
          </p>
        </div>

        <div className="statistics-grid">
          <article className="statistic-card">
            <div className="statistic-card-header">
              <span className="statistic-icon" aria-hidden="true">
                📍
              </span>

              <span className="statistic-label">Tracking detections</span>
            </div>

            <strong className="statistic-value">
              {statistics.totalPositions.toLocaleString()}
            </strong>

            <span className="statistic-description">
              Recorded spatial observations
            </span>
          </article>

          <article className="statistic-card">
            <div className="statistic-card-header">
              <span className="statistic-icon" aria-hidden="true">
                🦈
              </span>

              <span className="statistic-label">Tagged sharks</span>
            </div>

            <strong className="statistic-value">
              {statistics.uniqueSharks}
            </strong>

            <span className="statistic-description">
              Unique tagged individuals
            </span>
          </article>

          <article className="statistic-card">
            <div className="statistic-card-header">
              <span className="statistic-icon statistic-icon-text">♀</span>

              <span className="statistic-label">Female sharks</span>
            </div>

            <strong className="statistic-value">
              {statistics.femaleSharks}
            </strong>

            <span className="statistic-description">
              {femalePercentage.toFixed(1)}% of sharks with known sex
            </span>
          </article>

          <article className="statistic-card">
            <div className="statistic-card-header">
              <span className="statistic-icon statistic-icon-text">♂</span>

              <span className="statistic-label">Male sharks</span>
            </div>

            <strong className="statistic-value">{statistics.maleSharks}</strong>

            <span className="statistic-description">
              {malePercentage.toFixed(1)}% of sharks with known sex
            </span>
          </article>

          <article className="statistic-card">
            <div className="statistic-card-header">
              <span className="statistic-icon statistic-icon-text">?</span>

              <span className="statistic-label">Unknown sex</span>
            </div>

            <strong className="statistic-value">
              {statistics.unknownSexSharks}
            </strong>

            <span className="statistic-description">
              Individuals without a recorded sex classification
            </span>
          </article>

          <article className="statistic-card">
            <div className="statistic-card-header">
              <span className="statistic-icon" aria-hidden="true">
                📅
              </span>

              <span className="statistic-label">Tracking period</span>
            </div>

            <strong className="statistic-date-range">
              {formatDate(statistics.earliestDate)}
            </strong>

            <span className="statistic-description">
              to {formatDate(statistics.latestDate)}
            </span>
          </article>
        </div>
      </section>

      <section className="overview-section overview-information-grid">
        <article className="information-card">
          <h3>About the dataset</h3>

          <p>
            The dataset contains high-resolution spatial observations of tagged
            white sharks. Each row represents a recorded shark position together
            with attributes such as shark identifier, sex, age class, size class
            and timestamp.
          </p>
        </article>

        <article className="information-card">
          <h3>Study area</h3>

          <p>
            The observations were collected from white sharks tracked in coastal
            waters around New South Wales, Australia. The movement explorer
            displays where individual sharks were recorded through time.
          </p>
        </article>

        <article className="information-card">
          <h3>How to interpret the map</h3>

          <p>
            Recorded positions are observations rather than a complete,
            continuous account of each shark&apos;s movement. Long gaps between
            timestamps may indicate periods in which no valid position was
            available.
          </p>
        </article>

        <article className="information-card">
          <h3>Data quality</h3>

          <p>
            Some timestamp values in the source data cannot be interpreted as
            complete dates. These observations may still be counted in the
            dataset summary, but they are excluded from chronological movement
            animation.
          </p>
        </article>
      </section>

      <section className="overview-section">
        <div className="section-heading">
          <h3>Explore the data</h3>

          <p>
            Use the interactive views to investigate individual movement records
            and compare patterns across the dataset.
          </p>
        </div>

        <div className="exploration-grid">
          <Link className="exploration-card" to="/map">
            <span className="exploration-card-icon" aria-hidden="true">
              🗺️
            </span>

            <div>
              <h4>Movement Explorer</h4>

              <p>
                Select a tagged shark and replay its recorded positions through
                time on an interactive map.
              </p>

              <span className="exploration-card-action">
                Explore movements →
              </span>
            </div>
          </Link>

          <Link className="exploration-card" to="/analysis">
            <span className="exploration-card-icon" aria-hidden="true">
              📊
            </span>

            <div>
              <h4>Comparison and Analysis</h4>

              <p>
                Compare sharks by detection count, attributes and temporal
                distribution.
              </p>

              <span className="exploration-card-action">View analysis →</span>
            </div>
          </Link>
        </div>
      </section>
    </section>
  );
}

export default OverviewPage;
