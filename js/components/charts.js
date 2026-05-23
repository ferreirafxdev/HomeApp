// ============================================
// HOME CARE APP — Charts (Canvas API)
// Simple, lightweight chart rendering
// ============================================

const Charts = (() => {

  function lineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const {
      labels = [],
      datasets = [],
      showGrid = true,
      showDots = true,
      animated = true
    } = data;

    // Calculate min/max
    let allValues = datasets.flatMap(d => d.values);
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);
    const range = max - min || 1;
    min = min - range * 0.1;
    max = max + range * 0.1;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        const value = max - ((max - min) / gridLines) * i;
        ctx.fillStyle = '#8B949E';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(value).toString(), padding.left - 8, y + 4);
      }
    }

    // Draw X-axis labels
    ctx.fillStyle = '#8B949E';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const step = chartWidth / (labels.length - 1 || 1);
    labels.forEach((label, i) => {
      const x = padding.left + step * i;
      ctx.fillText(label, x, height - padding.bottom + 20);
    });

    // Draw datasets
    datasets.forEach((dataset, di) => {
      const { values, color = '#0A84FF', fillColor, label } = dataset;
      const points = values.map((v, i) => ({
        x: padding.left + step * i,
        y: padding.top + chartHeight - ((v - min) / (max - min)) * chartHeight
      }));

      // Fill area
      if (fillColor) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Smooth curve
      if (points.length > 2) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const cp1x = (points[i].x + points[i + 1].x) / 2;
          const cp1y = points[i].y;
          const cp2x = (points[i].x + points[i + 1].x) / 2;
          const cp2y = points[i + 1].y;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
        }
      } else {
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
      }
      ctx.stroke();

      // Draw dots
      if (showDots) {
        points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#0D1117';
          ctx.fill();
        });
      }
    });
  }

  function barChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const { labels = [], values = [], colors = [] } = data;
    const max = Math.max(...values) * 1.1 || 1;

    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const value = max - (max / 4) * i;
      ctx.fillStyle = '#8B949E';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(value).toString(), padding.left - 8, y + 4);
    }

    // Bars
    const barWidth = Math.min(40, (chartWidth / labels.length) * 0.6);
    const barGap = (chartWidth - barWidth * labels.length) / (labels.length + 1);

    labels.forEach((label, i) => {
      const x = padding.left + barGap + (barWidth + barGap) * i;
      const barHeight = (values[i] / max) * chartHeight;
      const y = padding.top + chartHeight - barHeight;
      const color = colors[i] || '#0A84FF';

      // Bar with rounded top
      const radius = Math.min(6, barWidth / 2);
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
      ctx.lineTo(x + barWidth, padding.top + chartHeight);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.closePath();

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '40');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Label
      ctx.fillStyle = '#8B949E';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, height - padding.bottom + 20);

      // Value on top
      ctx.fillStyle = '#F0F6FC';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText(values[i].toString(), x + barWidth / 2, y - 6);
    });
  }

  function donutChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const { segments = [], centerText = '', centerSubtext = '' } = data;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const lineWidth = radius * 0.3;

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;
    segments.forEach(segment => {
      const sweepAngle = (segment.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - lineWidth / 2, startAngle, startAngle + sweepAngle);
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      startAngle += sweepAngle + 0.02;
    });

    // Center text
    if (centerText) {
      ctx.fillStyle = '#F0F6FC';
      ctx.font = `700 ${size * 0.15}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerText, cx, cy - 6);
    }
    if (centerSubtext) {
      ctx.fillStyle = '#8B949E';
      ctx.font = `400 ${size * 0.07}px Inter, sans-serif`;
      ctx.fillText(centerSubtext, cx, cy + size * 0.1);
    }
  }

  // Sparkline mini chart
  function sparkline(canvasId, values, color = '#0A84FF') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const step = w / (values.length - 1);
    const points = values.map((v, i) => ({
      x: step * i,
      y: h - ((v - min) / range) * (h - 4) - 2
    }));

    ctx.clearRect(0, 0, w, h);

    // Area
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(w, h);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  return { lineChart, barChart, donutChart, sparkline };
})();
