import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Reports = () => {
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Nuevo estado para manejar errores

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No se encontró el token de autenticación.');
          setLoading(false);
          return;
        }

        const response = await fetch('http://127.0.0.1:5000/reports/by-category', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener el reporte.');
        }

        const data = await response.json();

        if (data.length === 0) {
          setCategoryData({ datasets: [{ data: [] }] });
        } else {
          // Formatea los datos para el gráfico
          const chartData = {
            labels: data.map(item => item.category),
            datasets: [{
              label: 'Gastos por Categoría',
              data: data.map(item => item.total),
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
              ],
            }]
          };
          setCategoryData(chartData);
        }
      } catch (err) {
        console.error("Error al cargar el reporte:", err);
        setError(err.message || 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  if (loading) {
    return <div>Cargando reportes...</div>;
  }

  if (error) {
    return <div style={{color: 'red'}}>Error: {error}</div>;
  }

  if (!categoryData || categoryData.datasets[0].data.length === 0) {
    return <div>No hay datos para mostrar el reporte por categoría.</div>;
  }

  return (
    <div className="reports-container">
      <h3>Reporte de Gastos por Categoría</h3>
      <div style={{ width: '400px', margin: 'auto' }}>
        <Pie data={categoryData} />
      </div>
    </div>
  );
};

export default Reports;