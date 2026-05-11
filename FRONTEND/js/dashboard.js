document.addEventListener("DOMContentLoaded", () => {
  // 1. Verificar sesión de forma silenciosa
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user"));

  // Si no hay token o datos, redirigir sin alertas molestas
  if (!token || !userData) {
    window.location.href = "/index.html";
    return; // Detiene la ejecución del resto del código
  }

  // 2. Cargar y renderizar el Sidebar en cualquier página que tenga el contenedor
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

  // 3. Si estamos en dashboard.html, mostrar mensaje de bienvenida
  const welcomeSection = document.getElementById("welcomeSection");
  if (welcomeSection) {
    const nombreParaMostrar = userData.nombre || userData.Email || "Invitado";
    const rolNombre = getRolName(userData.rolNombre ?? userData.IDRol ?? userData.rol);
    const welcomeTitle = document.getElementById("welcomeTitle");
    const welcomeMessage = document.getElementById("welcomeMessage");
    const currentDate = document.getElementById("currentDate");

    if (welcomeTitle) {
      welcomeTitle.textContent = `Bienvenido, ${nombreParaMostrar}`;
    }

    if (welcomeMessage) {
      welcomeMessage.textContent = `Rol: ${rolNombre}`;
    }

    if (currentDate) {
      const today = new Date();
      const formattedDate = today.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      currentDate.textContent = `📅 Hoy es ${formattedDate}`;
    }
  }

  // 4. Control de Roles para proteger administrador.html
  const isAdminPage = window.location.pathname.includes("administrador.html");
  if (isAdminPage) {
    const isAdmin = userData.IDRol === 1 || userData.rol === 1;
    if (!isAdmin) {
      // Redirigir a dashboard si no es admin
      window.location.href = "dashboard.html";
      return;
    }
  }
});

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

// Función para obtener el nombre del rol basado en IDRol
function getRolName(rolId) {
  const rolesById = {
    1: 'Administrador',
    2: 'Cliente',
    3: 'Gerente',
    4: 'Recepcionista'
  };

  if (rolId === null || rolId === undefined) return 'Desconocido';

  // Si llega como objeto (defensivo)
  if (typeof rolId === 'object') {
    rolId = rolId.IDRol ?? rolId.rol ?? rolId.id ?? rolId.Nombre;
  }

  // Soportar ID numérico o string numérico
  const asNumber = Number(rolId);
  if (Number.isFinite(asNumber) && rolesById[asNumber]) {
    return rolesById[asNumber];
  }

  // Soportar nombre de rol (string)
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

    // Si es un nombre nuevo (p.ej. "Empleado"), mostrarlo tal cual
    if (trimmed && !Number.isFinite(Number(trimmed))) return trimmed;
  }

  return 'Desconocido';
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

  // Aplicar permisos del rol (controla todos los links incluyendo admin)
  applyRolePermissions(userData);

  // Agregar event listeners para los links de admin
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
