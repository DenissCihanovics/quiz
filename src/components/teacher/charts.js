import React, { useRef, useEffect } from 'react';

const Chart = ({ type, data, options = {} }) => {
  const canvasRef = useRef(null);

  // Canvas rendering helpers are defined in-component and intentionally not
  // included in dependencies to avoid unnecessary redraw loops.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Устанавливаем размеры canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    if (type === 'bar') {
      drawBarChart(ctx, data, canvasWidth, canvasHeight, options);
    } else if (type === 'pie') {
      drawPieChart(ctx, data, canvasWidth, canvasHeight, options);
    } else if (type === 'line') {
      drawLineChart(ctx, data, canvasWidth, canvasHeight, options);
    }
  }, [type, data, options]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Функция для отрисовки столбчатой диаграммы
  const drawBarChart = (ctx, data, canvasWidth, canvasHeight, options) => {
    const { labels, values, colors = [] } = data;
    const padding = 40;
    const chartWidth = canvasWidth - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;
    
    // Находим максимальное значение для масштабирования
    const maxValue = Math.max(...values);
    const barWidth = chartWidth / labels.length * 0.8;
    const spacing = chartWidth / labels.length * 0.2;
    
    // Рисуем оси
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Рисуем столбцы
    labels.forEach((label, index) => {
      const x = padding + (index * (barWidth + spacing)) + spacing / 2;
      const barHeight = (values[index] / maxValue) * chartHeight;
      const y = canvasHeight - padding - barHeight;
      
      // Цвет столбца
      const color = colors[index] || getRandomColor();
      
      // Рисуем столбец
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Подпись столбца
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, canvasHeight - padding + 20);
      
      // Значение столбца
      ctx.fillText(values[index], x + barWidth / 2, y - 10);
    });
    
    // Название графика
    if (options.title) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(options.title, canvasWidth / 2, padding / 2);
    }
  };

  // Функция для отрисовки круговой диаграммы
  const drawPieChart = (ctx, data, canvasWidth, canvasHeight, options) => {
    const { labels, values, colors = [] } = data;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    // Вычисляем общую сумму
    const total = values.reduce((acc, value) => acc + value, 0);
    
    // Начальный угол
    let startAngle = 0;
    
    // Рисуем сегменты
    values.forEach((value, index) => {
      // Вычисляем угол сегмента
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Цвет сегмента
      const color = colors[index] || getRandomColor();
      
      // Рисуем сегмент
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      
      // Подпись сегмента (если есть место)
      if (sliceAngle > 0.2) {
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value} (${Math.round((value / total) * 100)}%)`, labelX, labelY);
      }
      
      // Обновляем начальный угол для следующего сегмента
      startAngle += sliceAngle;
    });
    
    // Название графика
    if (options.title) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(options.title, centerX, 20);
    }
    
    // Легенда
    if (options.showLegend !== false) {
      const legendX = canvasWidth - 120;
      const legendY = 60;
      
      labels.forEach((label, index) => {
        const y = legendY + index * 25;
        
        // Цвет квадратика
        const color = colors[index] || getRandomColor();
        
        // Рисуем квадратик
        ctx.fillStyle = color;
        ctx.fillRect(legendX, y, 15, 15);
        
        // Подпись
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, legendX + 25, y + 7);
      });
    }
  };

  // Функция для отрисовки линейного графика
  const drawLineChart = (ctx, data, canvasWidth, canvasHeight, options) => {
    const { labels, datasets } = data;
    const padding = 40;
    const chartWidth = canvasWidth - 2 * padding;
    const chartHeight = canvasHeight - 2 * padding;
    
    // Находим максимальное значение для масштабирования
    const allValues = datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues, 0);
    
    // Рисуем оси
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding, canvasHeight - padding);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Рисуем подписи по оси X
    labels.forEach((label, index) => {
      const x = padding + (index * (chartWidth / (labels.length - 1)));
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, canvasHeight - padding + 20);
    });
    
    // Рисуем линии для каждого набора данных
    datasets.forEach(dataset => {
      const { data, color = getRandomColor() } = dataset;
      
      // Рисуем линию
      ctx.beginPath();
      data.forEach((value, index) => {
        const x = padding + (index * (chartWidth / (data.length - 1)));
        const y = canvasHeight - padding - (value / maxValue) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Рисуем точки
      data.forEach((value, index) => {
        const x = padding + (index * (chartWidth / (data.length - 1)));
        const y = canvasHeight - padding - (value / maxValue) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });
    
    // Название графика
    if (options.title) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(options.title, canvasWidth / 2, padding / 2);
    }
    
    // Легенда
    if (datasets.length > 1 && options.showLegend !== false) {
      const legendX = canvasWidth - 120;
      const legendY = 60;
      
      datasets.forEach((dataset, index) => {
        const { color = getRandomColor(), label } = dataset;
        const y = legendY + index * 25;
        
        // Рисуем линию
        ctx.beginPath();
        ctx.moveTo(legendX, y + 7);
        ctx.lineTo(legendX + 15, y + 7);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Рисуем точку
        ctx.beginPath();
        ctx.arc(legendX + 7, y + 7, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Подпись
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, legendX + 25, y + 7);
      });
    }
  };

  // Функция для генерации случайного цвета
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={options.width || 500} 
      height={options.height || 300}
      className="chart-canvas"
    />
  );
};

export default Chart;