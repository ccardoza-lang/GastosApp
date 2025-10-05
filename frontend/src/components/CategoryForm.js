import React, { useState } from 'react';

const CategoryForm = ({ onCategoryAdded }) => {
  const [name, setName] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch('http://127.0.0.1:5000/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (response.ok) {
      alert('Categoría creada exitosamente.');
      setName('');
      onCategoryAdded(); // Actualiza la lista de categorías
    } else {
      alert('Error al crear la categoría.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Agregar Nueva Categoría</h3>
      <input
        type="text"
        placeholder="Nombre de la categoría"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">Crear Categoría</button>
    </form>
  );
};

export default CategoryForm;