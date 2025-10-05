import React, { useState, useEffect } from 'react';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener las categorías del usuario para el dropdown
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró el token de autenticación.');
        }

        const response = await fetch('http://127.0.0.1:5000/categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al cargar las categorías.');
        }

        const data = await response.json();
        setCategories(data.categories || []);
        setError(null); // Limpiar cualquier error anterior si la carga es exitosa
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };
    fetchCategories();
  }, []); // El array de dependencias vacío asegura que se ejecuta solo una vez al inicio

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }

      const payload = {
        amount: parseFloat(amount),
        description,
        date,
        categoryId: parseInt(categoryId, 10),
      };

      const response = await fetch('http://127.0.0.1:5000/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al agregar el gasto.');
      }

      alert('Gasto agregado exitosamente.');
      setAmount('');
      setDescription('');
      setDate('');
      setCategoryId('');
      onExpenseAdded(); // Recarga los gastos en el Dashboard
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (error) {
    return <div>Error al cargar las categorías: {error}</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Agregar Nuevo Gasto</h3>
      <input
        type="number"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <select 
        value={categoryId} 
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        <option value="">Selecciona una categoría</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <button type="submit">Guardar Gasto</button>
    </form>
  );
};

export default ExpenseForm;