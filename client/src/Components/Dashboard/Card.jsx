import React from "react";

const Card = ({ title, value, color, subtitle }) => {
  return (
    <div className="card" style={{ '--card-accent': color }}>
      <h4>{title}</h4>
      <p>{value}</p>
      {subtitle ? <span className="card-subtitle">{subtitle}</span> : null}
    </div>
  );
};

export default Card;
