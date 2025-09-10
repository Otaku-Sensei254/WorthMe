import React from "react";

const Card = ({ title, value, color }) => {
  return (
    <div className="card" style={{ borderTop: `5px solid ${color}` }}>
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
};

export default Card;
