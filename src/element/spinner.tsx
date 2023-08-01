import "./spinner.css";

export interface IconProps {
  className?: string;
  width?: number;
  height?: number;
}

const Spinner = (props: IconProps) => (
  <svg
    width="20"
    height="20"
    stroke="currentColor"
    viewBox="0 0 20 20"
    {...props}
  >
    <g className="spinner_V8m1">
      <circle cx="10" cy="10" r="7.5" fill="none" strokeWidth="3"></circle>
    </g>
  </svg>
);

export default Spinner;
