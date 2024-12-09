import React, { useState, useEffect } from 'react';
import SearchCars from "../SearchCars";
import SearchUsers from "../SearchUsers";

export default function Search() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '20px',
      gap: '40px',
      flexWrap: 'wrap',
      margin: '0 auto'
    }}>
      <div style={{ width: '400px', minWidth: '400px' }}>
        <SearchUsers />
      </div>
      <div style={{ width: '400px', minWidth: '400px' }}>
        <SearchCars />
      </div>
    </div>
  );
}