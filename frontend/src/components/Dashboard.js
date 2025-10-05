import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import CategoryForm from './CategoryForm';
import Reports from './Reports';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No se encontró el token de autenticación.");
      }

      const response = await fetch('http://127.0.0.1:5000/expenses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar los gastos.');
      }

      const data = await response.json();
      setExpenses(data.expenses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  if (loading) {
    return <div>Cargando gastos...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="forms-section">
        <ExpenseForm onExpenseAdded={fetchExpenses} />
        <CategoryForm onCategoryAdded={() => console.log('Categoría agregada')} /> {/* Implementa esta función si es necesario */}
      </div>

      <div className="reports-section">
        <Reports />
      </div>
      
      <h2>Tus Gastos</h2>
      <table>
        <thead>
          <tr>
            <th>Monto</th>
            <th>Descripción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>S/{expense.amount}</td>
              <td>{expense.description}</td>
              <td>{expense.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;