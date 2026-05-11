document.addEventListener("DOMContentLoaded", () => {
  // 1. Verificar sesión y rol de admin
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user"));

  // Si no hay token o datos, redirigir sin alertas molestas
  if (!token || !userData) {
    window.location.href = "/index.html";
    return;
  }

  // 2. Verificar si tiene permiso para acceder a dashboard
  const permisos = userData.permisos || [];
  if (!permisos.includes('dashboard')) {
    window.location.href = "dashboard.html";
    return;
  }

  // 3. Cargar y renderizar el Sidebar
  const sidebarContainer = document.getElementById("sidebar-container");
  if (sidebarContainer) {
    fetch("/src/components/header.html")
      .then(response => response.text())
      .then(html => {
        sidebarContainer.innerHTML = html;
        // Ejecutar lógica del sidebar después de cargarlo
        initializeSidebar(userData);
      })
      .catch(error => console.error("Error cargando sidebar:", error));
  }

  // 4. Inicializar gráfica
  drawDashboardChart();
});

// Función para obtener el nombre del rol basado en IDRol
function getRolName(rolId) {
  const rolesById = {
    1: 'Administrador',
    2: 'Cliente',
    3: 'Gerente',
    4: 'Recepcionista'
  };

  if (rolId === null || rolId === undefined) return 'Desconocido';

  if (typeof rolId === 'object') {
    rolId = rolId.IDRol ?? rolId.rol ?? rolId.id ?? rolId.Nombre;
  }

  const asNumber = Number(rolId);
  if (Number.isFinite(asNumber) && rolesById[asNumber]) {
    return rolesById[asNumber];
  }

  if (typeof rolId === 'string') {
    const trimmed = rolId.trim();
    const normalized = trimmed.toLowerCase();
    const rolesByName = {
      administrador: 'Administrador',
      admin: 'Administrador',
      cliente: 'Cliente',
      usuario: 'Usuario',
      gerente: 'Gerente',
      recepcionista: 'Recepcionista'
    };
    if (rolesByName[normalized]) return rolesByName[normalized];

    if (trimmed && !Number.isFinite(Number(trimmed))) return trimmed;
  }

  return 'Desconocido';
}

// Función para aplicar permisos y mostrar/ocultar secciones
function applyRolePermissions(userData) {
  // Obtener permisos del usuario (array)
  const permisos = userData.permisos || [];
  
  // Mapeo de permisos a IDs de elementos en sidebar
  const permisoElementMap = {
    'dashboard': 'link-dashboard',
    'usuarios': 'link-usuarios',
    'roles': 'link-roles',
    'habitaciones': 'link-habitaciones',
    'servicios': 'link-servicios',
    'reservas': 'link-reservas'
  };

  // Mostrar/ocultar elementos según permisos
  Object.entries(permisoElementMap).forEach(([permiso, elementId]) => {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      if (permisos.includes(permiso)) {
        elemento.classList.remove('hidden');
        elemento.style.display = 'block';
      } else {
        elemento.classList.add('hidden');
        elemento.style.display = 'none';
      }
    }
  });
}

// Función para inicializar elementos del Sidebar
function initializeSidebar(userData) {
  const nombreParaMostrar = userData.nombre || userData.Email || "Invitado";
  const rolNombre = getRolName(userData.rolNombre ?? userData.IDRol ?? userData.rol);
  
  // Mostrar nombre en el sidebar
  const sidebarUserName = document.getElementById("sidebarUserName");
  if (sidebarUserName) {
    sidebarUserName.textContent = nombreParaMostrar;
  }

  // Mostrar rol en el sidebar
  const sidebarUserRole = document.getElementById("sidebarUserRole");
  if (sidebarUserRole) {
    sidebarUserRole.textContent = `Rol: ${rolNombre}`;
  }

  // Aplicar permisos del rol (controla todos los links)
  applyRolePermissions(userData);

  // Event listeners para los links
  const linkUsuarios = document.getElementById("link-usuarios");
  const linkRoles = document.getElementById("link-roles");

  if (linkUsuarios) {
    linkUsuarios.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/src/pages/usuarios.html";
    });
  }

  if (linkRoles) {
    linkRoles.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/src/pages/roles.html";
    });
  }

  // Botón de Perfil en el Sidebar
  const sidebarProfileBtn = document.getElementById("sidebarProfileBtn");
  if (sidebarProfileBtn) {
    sidebarProfileBtn.addEventListener("click", () => {
      window.location.href = "/src/pages/perfil.html";
    });
  }

  // Botón de Cerrar Sesión en el Sidebar
  const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
  if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/index.html";
    });
  }

  // Inicializar toggle del sidebar
  initializeSidebarToggle();
}

// Función para inicializar el toggle del sidebar
function initializeSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggleSidebar');
  const toggleIcon = document.getElementById('toggleIcon');
  const brandText = document.getElementById('brandText');
  const userInfo = document.getElementById('userInfo');
  const logoutText = document.querySelector('.logoutText');
  const profileText = document.querySelector('.profileText');
  const buttonsContainer = document.getElementById('sidebarButtonsContainer');
  const navTexts = document.querySelectorAll('.navText');

  if (!sidebar || !toggleBtn) return; // Si no existen los elementos, salir

  let isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

  // Aplicar estado inicial
  function applySidebarState() {
    if (isCollapsed) {
      sidebar.style.width = '80px';
      brandText?.classList.add('hidden');
      userInfo?.classList.add('hidden');
      logoutText?.classList.add('hidden');
      profileText?.classList.add('hidden');
      buttonsContainer?.classList.add('flex-col');
      buttonsContainer?.classList.remove('gap-2');
      buttonsContainer?.classList.add('gap-1');
      navTexts.forEach(text => text?.classList.add('hidden'));
      toggleIcon.textContent = '▶';
      document.body.classList.add('sidebar-collapsed');
    } else {
      sidebar.style.width = '288px';
      brandText?.classList.remove('hidden');
      userInfo?.classList.remove('hidden');
      logoutText?.classList.remove('hidden');
      profileText?.classList.remove('hidden');
      buttonsContainer?.classList.remove('flex-col');
      buttonsContainer?.classList.remove('gap-1');
      buttonsContainer?.classList.add('gap-2');
      navTexts.forEach(text => text?.classList.remove('hidden'));
      toggleIcon.textContent = '◀';
      document.body.classList.remove('sidebar-collapsed');
    }
  }

  // Aplicar estado inicial
  applySidebarState();

  // Event listener para el toggle
  toggleBtn.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    applySidebarState();
  });
}

// DATOS DEL DASHBOARD FAKE
function drawDashboardChart() {
  const chartCanvas = document.getElementById("dashboardChart");
  if (!chartCanvas) return;

  const ctx = chartCanvas.getContext("2d");
  
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio"],
      datasets: [
        {
          label: "Reservas",
          data: [45, 52, 48, 61, 55, 67],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Ingresos ($1000s)",
          data: [32, 38, 35, 42, 39, 48],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Ocupación (%)",
          data: [68, 72, 65, 78, 74, 82],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
