# 🚀 Guía de Ejecución - MyBehavior

## ¿Cómo abrir la app?

### Opción 1: Servidor Python (Recomendado) ✅

```bash
# En la carpeta del proyecto
python3 -m http.server 8000

# Luego abre tu navegador en:
http://localhost:8000/src/index.html
```

### Opción 2: Servidor Node.js
```bash
# Si tienes Node.js instalado
npx http-server -p 8000

# Luego abre en:
http://localhost:8000/src/index.html
```

### Opción 3: Directamente (Sin servidor - algunas funciones limitadas)
```bash
# Solo abre en tu navegador:
file:///ruta/a/tu/proyecto/src/index.html
```

---

## 📱 ¿Qué verás?

### 🎯 4 Secciones Principales:

1. **📈 Cambio Semanal**
   - Comparativa visual semana actual vs anterior
   - Gráficos de evolución
   - Recomendaciones automáticas

2. **📊 Analytics**
   - Top 5 mejores estudiantes
   - Estudiantes en riesgo con alertas
   - Gráficos de distribución
   - Estadísticas por curso
   - Insights clave

3. **👥 Gestión de Estudiantes**
   - Búsqueda y filtrado por curso
   - Click en "Detalle" para abrir perfil individual
   - **Modal con simulador en tiempo real**

4. **📝 Decisiones**
   - Registrar decisiones pedagógicas
   - Historial completo
   - Documentación de medidas

---

## ⚙️ Funcionalidades del Modal (Estudiante)

### Pestaña "Perfil"
- Gráfico de evolución de 8 semanas
- Información actual del estudiante

### Pestaña "Simulador" ⭐ **LO MÁS IMPORTANTE**
- **Selecciona una medida** (Diálogo, Suspensión, etc.)
- **Ve en tiempo real** cómo cambia:
  - Puntuación del estudiante
  - Categoría (Excelente/Bueno/Regular/Insuficiente)
  - Sanción aplicable
  - Probabilidad de mejora

### Pestaña "Historial"
- Eventos pasados del estudiante
- Medidas aplicadas anteriormente

---

## 🎨 Características Visuales

✅ **Diseño Responsive** - Funciona en móvil, tablet y PC
✅ **Colores Intuitivos**:
   - 🟢 Verde = Excelente
   - 🔵 Azul = Bueno
   - 🟡 Amarillo = Regular/Alerta
   - 🔴 Rojo = Crítico/Insuficiente

✅ **Gráficos con Chart.js**
✅ **Animaciones suaves**
✅ **Datos de ejemplo funcionales**

---

## 🐛 Solución de Problemas

**P: La app se ve sin estilos**
R: Asegúrate de servir con un servidor (Python/Node). No funciona con `file://`

**P: Los gráficos no aparecen**
R: Verifica que Chart.js se descargó desde CDN (necesitas internet)

**P: Los botones no funcionan**
R: Abre la consola (F12) para ver errores. Verifica las rutas de archivos.

---

## 📂 Estructura del Proyecto

```
MyBehavior/
├── src/
│   ├── index.html        ← Abre esto en el navegador
│   ├── js/
│   │   └── main.js       ← Toda la lógica
│   └── styles/
│       └── main.css      ← Todos los estilos
├── package.json
└── README.md
```

---

## 🎯 Próximos Pasos

1. ✅ Abre la app con Python/Node
2. ✅ Explora las 4 secciones
3. ✅ Haz click en un estudiante para ver el simulador
4. ✅ Juega con las medidas para ver el impacto
5. ✅ Registra decisiones en la sección de comentarios

¡Disfruta la app! 🚀
