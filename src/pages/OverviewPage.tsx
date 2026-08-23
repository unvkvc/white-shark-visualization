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
  validTimestamps: number;
  invalidTimestamps: number;
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
  return (
    <section className="overview-page">
      <header
        className="overview-hero"
        style={{
          backgroundImage: `
            radial-gradient(
              circle at top right,
              rgba(45, 212, 191, 0.38),
              transparent 45%
            ),
            linear-gradient(
              110deg,
              rgba(2, 8, 20, 0.97) 0%,
              rgba(6, 38, 67, 0.88) 45%,
              rgba(8, 105, 135, 0.68) 100%
            ),
            url(${sharkBackground})
          `,
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
          <h3>Dataset at a glance</h3>

          <p>
            Key characteristics of the tagged sharks and recorded positions.
          </p>
        </div>

        <div className="dataset-summary">
          <div className="dataset-summary-item">
            <span className="dataset-summary-label">Tracked positions</span>

            <strong>{statistics.totalPositions.toLocaleString()}</strong>

            <small>Recorded spatial observations</small>
          </div>

          <div className="dataset-summary-item">
            <span className="dataset-summary-label">Tagged sharks</span>

            <strong>{statistics.uniqueSharks}</strong>

            <small>Unique individuals</small>
          </div>

          <div className="dataset-summary-item">
            <span className="dataset-summary-label">Tracking period</span>

            <strong className="dataset-summary-date">
              {formatDate(statistics.earliestDate)}
            </strong>

            <small>to {formatDate(statistics.latestDate)}</small>
          </div>

          <div className="dataset-summary-item">
            <span className="dataset-summary-label">Recorded sex</span>

            <strong className="dataset-summary-sex">
              {statistics.femaleSharks} F · {statistics.maleSharks} M
            </strong>

            <small>{statistics.unknownSexSharks} unknown</small>
          </div>
        </div>

        <p className="timestamp-summary">
          <strong>{statistics.validTimestamps.toLocaleString()}</strong>{" "}
          positions contain complete timestamps and can be used for
          chronological animation;{" "}
          <strong>{statistics.invalidTimestamps.toLocaleString()}</strong> have
          incomplete timestamps.
        </p>
      </section>

      <section className="overview-context">
        <div className="overview-context-main">
          <h3>About the data</h3>

          <p>
            The dataset contains high-resolution spatial observations of tagged
            white sharks tracked in coastal waters off Southern California, USA.
            Each record includes a shark identifier, position, sex, age class,
            size class and timestamp.
          </p>
        </div>

        <div className="overview-context-note">
          <h3>Interpreting movement</h3>

          <p>
            Recorded positions are observations rather than a continuous
            reconstruction of movement. Gaps between timestamps indicate periods
            without valid chronological positions.
          </p>
        </div>
      </section>
    </section>
  );
}

export default OverviewPage;
