/* =========================================================
   MENTE AMANTE
   PANEL DE GESTIÓN
   panel.js
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


/* =========================================================
   ELEMENTOS GENERALES
========================================================= */

const panelTitle =
    document.getElementById("panelTitle");

const userName =
    document.getElementById("userName");

const userRole =
    document.getElementById("userRole");

const logoutButton =
    document.getElementById("logoutButton");

let profile = null;


/* =========================================================
   UTILIDADES
========================================================= */

function nombreCompleto(persona) {

    if (!persona) {
        return "—";
    }

    return (
        persona.nombre || ""
    ) +
    (
        persona.apellidos
            ? " " + persona.apellidos
            : ""
    );
}


function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function traducirRol(rol) {

    const roles = {

        propietario: "Propietario",

        administrador: "Administrador",

        trabajador: "Profesional"

    };

    return roles[rol] || rol || "—";
}


function mostrarError(mensaje) {

    console.error(mensaje);

    alert(
        typeof mensaje === "string"
            ? mensaje
            : "Ha ocurrido un error."
    );
}


/* =========================================================
   COMPROBAR USUARIO
========================================================= */

async function comprobarUsuario() {

    try {

        const {
            data: {
                user
            },
            error: userError
        } =
            await supabaseClient.auth.getUser();


        if (
            userError ||
            !user
        ) {

            window.location.href =
                "acceso.html";

            return false;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, nombre, apellidos, telefono, rol, activo"
                )
                .eq(
                    "id",
                    user.id
                )
                .single();


        console.log(
            "PERFIL RECIBIDO:",
            data
        );

        console.log(
            "ERROR PERFIL:",
            error
        );


        if (
            error ||
            !data ||
            !data.activo
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "acceso.html";

            return false;
        }


        profile = data;


        /* =====================================
           MOSTRAR USUARIO
        ===================================== */

        if (userName) {

            userName.textContent =
                nombreCompleto(profile);

            userName.style.setProperty(
                "color",
                "#c8a66a",
                "important"
            );
        }


        if (userRole) {

            userRole.textContent =
                traducirRol(profile.rol);
        }


        console.log(
            "Sesión iniciada como:",
            profile.rol
        );


        /* =====================================
           ELEMENTOS SOLO PARA PROPIETARIO /
           ADMINISTRADOR
        ===================================== */

        const ownerOnlyButtons =
            document.querySelectorAll(
                "[data-owner-only]"
            );


        ownerOnlyButtons.forEach(
            function (button) {

                if (
                    profile.rol !==
                        "propietario" &&
                    profile.rol !==
                        "administrador"
                ) {

                    button.style.display =
                        "none";
                }

            }
        );


        return true;

    } catch (error) {

        console.error(
            "Error comprobando usuario:",
            error
        );

        window.location.href =
            "acceso.html";

        return false;
    }
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

const navigationButtons =
    document.querySelectorAll(
        ".panel-nav-item"
    );

const sections =
    document.querySelectorAll(
        ".panel-section"
    );


const sectionTitles = {

    inicio:
        "Inicio",

    reservas:
        "Reservas",

    profesionales:
        "Profesionales",

    servicios:
        "Servicios",

    clientes:
        "Clientes",

    tpv:
        "TPV",

    facturacion:
        "Facturación"

    ,

    perfil:
        "Mi perfil"

};


navigationButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            async function () {

                const section =
                    button.dataset.section;


                navigationButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                sections.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                const selectedSection =
                    document.getElementById(
                        "section-" +
                        section
                    );


                if (selectedSection) {

                    selectedSection.classList.add(
                        "active"
                    );
                }


                if (panelTitle) {

                    panelTitle.textContent =
                        sectionTitles[section] ||
                        "Panel";
                }


                /* =================================
                   RECARGAS AL ENTRAR EN SECCIONES
                ================================= */

                if (
                    section ===
                    "profesionales"
                ) {

                    await cargarProfesionales();
                }


                if (
                    section ===
                    "reservas"
                ) {

                    await cargarReservas();
                }


                if (
                    section ===
                    "servicios"
                ) {

                    await cargarDatosDashboard();
                }


                if (
                    section ===
                    "clientes"
                ) {

                    await cargarDatosDashboard();
                }


                if (
                    section ===
                    "tpv"
                ) {

                    await cargarVentas();
                }

                if (
                    section ===
                    "facturacion"
                ) {

                    await cargarVentas();
                }

                if (section === "servicios") {
                    await cargarServicios();
                }

                if (section === "perfil") {
                    cargarPerfilForm();
                }

            }
        );

    }
);


/* =========================================================
   CERRAR SESIÓN
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                await supabaseClient.auth.signOut();

            } finally {

                window.location.href =
                    "acceso.html";
            }

        }
    );

}


/* =========================================================
   PROFESIONALES
========================================================= */

const professionalsTableBody =
    document.getElementById(
        "professionalsTableBody"
    );

const addProfessionalButton =
    document.getElementById(
        "addProfessionalButton"
    );

const professionalModal =
    document.getElementById(
        "professionalModal"
    );

const closeProfessionalModal =
    document.getElementById(
        "closeProfessionalModal"
    );

const professionalForm =
    document.getElementById(
        "professionalForm"
    );


/* =========================================================
   CARGAR PROFESIONALES
========================================================= */

async function cargarProfesionales() {

    if (!professionalsTableBody) {
        return;
    }


    professionalsTableBody.innerHTML = `
        <tr>
            <button class="table-action-button confirm-appointment-button" type="button" data-appointment-id="${escaparHTML(appointment.id)}" data-client-email="${escaparHTML(cliente?.email || "")}" data-client-phone="${escaparHTML(cliente?.telefono || "")}">
                colspan="5"
                class="table-loading"
            >
                Cargando profesionales...
            </td>
        </tr>
    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("professionals")
                .select("id, profile_id, nombre, apellidos, activo")
                .order("nombre", { ascending: true });


        console.log(
            "PROFESIONALES RECIBIDOS:",
            data
        );

        console.log(
            "ERROR PROFESIONALES:",
            error
        );


        if (error) {

            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            professionalsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="table-loading"
                    >
                        Todavía no hay profesionales registrados.
                    </td>
                </tr>
            `;

            return;
        }


        professionalsTableBody.innerHTML =
            data.map(
                function (professional) {

                    const nombre =
                        nombreCompleto(
                            professional
                        );


                    const inicial =
                        (
                            professional.nombre ||
                            "?"
                        )
                            .charAt(0)
                            .toUpperCase();


                    const rol =
                        professional.rol ===
                        "administrador"
                            ? "Administrador"
                            : "Profesional";


                    const activo =
                        professional.activo !== false;


                    const estado =
                        activo
                            ? "Activo"
                            : "Inactivo";


                    const estadoClase =
                        activo
                            ? "status-active"
                            : "status-inactive";


                    /*
                     * IMPORTANTE:
                     *
                     * Eliminará usando el ID numérico
                     * de professionals.
                     */

                    const profesionalId =
                        professional.id;


                    return `
                        <tr>

                            <td>

                                <div
                                    class="professional-name"
                                >

                                    <div
                                        class="professional-avatar"
                                    >
                                        ${escaparHTML(inicial)}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escaparHTML(nombre)}
                                        </strong>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${
                                    escaparHTML(
                                        professional.telefono ||
                                        "—"
                                    )
                                }
                            </td>


                            <td>
                                ${escaparHTML(rol)}
                            </td>


                            <td>

                                <span
                                    class="status-badge ${estadoClase}"
                                >
                                    ${estado}
                                </span>

                            </td>


                            <td>

                                ${
                                    profile &&
                                    profile.rol ===
                                    "propietario"
                                    ?

                                    `
                                    <button
                                        class="table-action-button delete-professional-button"
                                        type="button"
                                        data-professional-id="${escaparHTML(profesionalId)}"
                                        data-professional-name="${escaparHTML(nombre)}"
                                    >
                                        Eliminar
                                    </button>
                                    `

                                    :

                                    `
                                    <button
                                        class="table-action-button"
                                        type="button"
                                        disabled
                                    >
                                        Gestionar
                                    </button>
                                    `
                                }

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");


    } catch (error) {

        console.error(
            "Error cargando profesionales:",
            error
        );


        professionalsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-loading"
                >
                    No se han podido cargar los profesionales.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   ABRIR MODAL PROFESIONAL
========================================================= */

if (addProfessionalButton) {

    addProfessionalButton.addEventListener(
        "click",
        function () {

            if (
                !profile ||
                (
                    profile.rol !==
                    "propietario" &&
                    profile.rol !==
                    "administrador"
                )
            ) {

                alert(
                    "No tienes permisos para crear profesionales."
                );

                return;
            }


            if (professionalModal) {

                professionalModal.classList.add(
                    "active"
                );
            }

        }
    );
}


/* =========================================================
   CERRAR MODAL PROFESIONAL
========================================================= */

if (closeProfessionalModal) {

    closeProfessionalModal.addEventListener(
        "click",
        function () {

            if (professionalModal) {

                professionalModal.classList.remove(
                    "active"
                );
            }

        }
    );
}


if (professionalModal) {

    professionalModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                professionalModal
            ) {

                professionalModal.classList.remove(
                    "active"
                );
            }

        }
    );
}


/* =========================================================
   CREAR PROFESIONAL
========================================================= */

if (professionalForm) {

    professionalForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "professionalFormMessage"
                );


            const submitButton =
                professionalForm.querySelector(
                    'button[type="submit"]'
                );


            const nombre =
                document.getElementById(
                    "professionalName"
                )?.value.trim();


            const apellidos =
                document.getElementById(
                    "professionalSurname"
                )?.value.trim();


            const email =
                document.getElementById(
                    "professionalEmail"
                )?.value.trim()
                .toLowerCase();


            const telefono =
                document.getElementById(
                    "professionalPhone"
                )?.value.trim();


            const rol =
                document.getElementById(
                    "professionalRole"
                )?.value;


            if (message) {

                message.textContent =
                    "";
            }


            if (
                !nombre ||
                !email
            ) {

                if (message) {

                    message.style.color =
                        "#a65b43";

                    message.textContent =
                        "Nombre y correo electrónico son obligatorios.";
                }

                return;
            }


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Creando...";
            }


            try {

                const {
                    data: sessionData,
                    error: sessionError
                } =
                    await supabaseClient.auth
                        .getSession();


                if (
                    sessionError ||
                    !sessionData.session
                ) {

                    throw new Error(
                        "Tu sesión ha caducado. Vuelve a iniciar sesión."
                    );
                }


                const response =
                    await fetch(
                        `${SUPABASE_URL}/functions/v1/create-professional`,
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${sessionData.session.access_token}`,

                                "apikey":
                                    SUPABASE_PUBLISHABLE_KEY

                            },

                            body:
                                JSON.stringify({

                                    nombre,

                                    apellidos,

                                    email,

                                    telefono,

                                    rol

                                })
                        }
                    );


                let result = null;

                try {

                    result =
                        await response.json();

                } catch {

                    result = null;
                }


                if (!response.ok) {

                    throw new Error(
                        result?.error ||
                        "No se ha podido crear el profesional."
                    );
                }


                console.log(
                    "PROFESIONAL CREADO:",
                    result
                );


                if (message) {

                    message.style.color =
                        "#397247";

                    message.textContent =
                        "Profesional creado correctamente.";
                }


                professionalForm.reset();


                /*
                 * Esperamos un poco para que
                 * Supabase tenga disponible el
                 * nuevo registro.
                 */

                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            500
                        );

                    }
                );


                await cargarProfesionales();

                await cargarProfesionalesEnReserva();


                setTimeout(
                    function () {

                        if (professionalModal) {

                            professionalModal.classList.remove(
                                "active"
                            );
                        }


                        if (message) {

                            message.textContent =
                                "";
                        }

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "ERROR CREANDO PROFESIONAL:",
                    error
                );


                if (message) {

                    message.style.color =
                        "#a65b43";

                    message.textContent =
                        error.message ||
                        "Ha ocurrido un error.";
                }

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Crear profesional";
                }

            }

        }
    );

}


/* =========================================================
   ELIMINAR PROFESIONAL
========================================================= */

async function eliminarProfesional(
    profesionalId,
    nombreProfesional
) {

    if (!profile) {

        alert(
            "No se ha podido comprobar tu usuario."
        );

        return;
    }


    if (
        profile.rol !==
        "propietario"
    ) {

        alert(
            "Solo el propietario puede eliminar profesionales."
        );

        return;
    }


    if (!profesionalId) {

        alert(
            "No se ha encontrado el ID del profesional."
        );

        return;
    }


    const confirmado =
        confirm(
            `¿Seguro que quieres eliminar a ${nombreProfesional}?\n\n` +
            `Esta acción no se puede deshacer.`
        );


    if (!confirmado) {
        return;
    }


    try {

        console.log(
            "ELIMINANDO PROFESIONAL:",
            profesionalId
        );


        /*
         * IMPORTANTE:
         *
         * professionals.id es BIGINT.
         */

        let { data, error } = await supabaseClient.rpc(
            "eliminar_profesional",
            { p_profesional_id: Number(profesionalId) }
        );

        if (error) {
            const fallback = await supabaseClient
                .from("professionals")
                .delete()
                .eq("id", Number(profesionalId));

            if (!fallback.error) {
                data = fallback.data;
                error = null;
            }
        }


        console.log(
            "RESULTADO ELIMINACIÓN:",
            data
        );


        console.log(
            "ERROR ELIMINACIÓN:",
            error
        );


        if (error) {

            throw error;
        }


        alert(
            "Profesional eliminado correctamente."
        );


        await cargarProfesionales();

        await cargarProfesionalesEnReserva();


        /*
         * Actualizamos contadores.
         */

        await cargarDatosDashboard();


    } catch (error) {

        console.error(
            "ERROR ELIMINANDO PROFESIONAL:",
            error
        );


        let mensaje =
            error?.message ||
            "No se ha podido eliminar el profesional.";


        if (
            mensaje.includes(
                "reservas asociadas"
            )
        ) {

            mensaje =
                "No se puede eliminar este profesional porque tiene reservas asociadas.";
        }


        alert(mensaje);
    }
}


/* =========================================================
   SERVICIOS
========================================================= */

const servicesTableBody = document.getElementById("servicesTableBody");
const addServiceButton = document.getElementById("addServiceButton");
const serviceModal = document.getElementById("serviceModal");
const closeServiceModal = document.getElementById("closeServiceModal");
const serviceForm = document.getElementById("serviceForm");
const profileForm = document.getElementById("profileForm");

function pintarServicios(servicios) {
    if (!servicesTableBody) return;

    if (!servicios.length) {
        servicesTableBody.innerHTML = '<tr><td colspan="6" class="table-loading">Todavía no hay servicios.</td></tr>';
        return;
    }

    servicesTableBody.innerHTML = servicios.map(function (service) {
        const activo = service.activo !== false;
        return `
            <tr>
                <td><strong>${escaparHTML(service.nombre)}</strong><br><small>${escaparHTML(service.descripcion || "")}</small></td>
                <td>${escaparHTML(service.duracion_minutos)} min</td>
                <td>${Number(service.precio || 0).toFixed(2)} €</td>
                <td>${service.visible_web === false ? "No" : "Sí"}</td>
                <td><span class="status-badge ${activo ? "status-active" : "status-inactive"}">${activo ? "Activo" : "Inactivo"}</span></td>
                <td>
                    <button class="table-action-button edit-service-button" type="button" data-service-id="${escaparHTML(service.id)}">Editar</button>
                    <button class="table-action-button delete-service-button" type="button" data-service-id="${escaparHTML(service.id)}" data-service-name="${escaparHTML(service.nombre)}">Eliminar</button>
                </td>
            </tr>`;
    }).join("");
}

async function cargarServicios() {
    if (!servicesTableBody) return;
    servicesTableBody.innerHTML = '<tr><td colspan="6" class="table-loading">Cargando servicios...</td></tr>';

    const { data, error } = await supabaseClient
        .from("services")
        .select("id, nombre, descripcion, duracion_minutos, precio, visible_web, permite_reserva, disponible_tpv, activo")
        .order("nombre", { ascending: true });

    if (error) {
        console.error("Error cargando servicios:", error);
        servicesTableBody.innerHTML = '<tr><td colspan="6" class="table-loading">No se han podido cargar los servicios.</td></tr>';
        return;
    }

    pintarServicios(data || []);
}

function abrirModalServicio(service) {
    if (!serviceModal || !serviceForm) return;
    serviceForm.reset();
    document.getElementById("serviceId").value = service?.id || "";
    document.getElementById("serviceName").value = service?.nombre || "";
    document.getElementById("serviceDescription").value = service?.descripcion || "";
    document.getElementById("serviceDuration").value = service?.duracion_minutos || 60;
    document.getElementById("servicePrice").value = service?.precio || 0;
    document.getElementById("serviceVisibleWeb").checked = service?.visible_web !== false;
    document.getElementById("serviceAllowsBooking").checked = service?.permite_reserva !== false;
    document.getElementById("serviceAvailableTpv").checked = service?.disponible_tpv !== false;
    document.getElementById("serviceActive").checked = service?.activo !== false;
    document.getElementById("serviceModalTitle").textContent = service ? "Editar servicio" : "Añadir servicio";
    serviceModal.classList.add("active");
}

if (addServiceButton) addServiceButton.addEventListener("click", function () { abrirModalServicio(); });
if (closeServiceModal) closeServiceModal.addEventListener("click", function () { serviceModal.classList.remove("active"); });
if (serviceModal) serviceModal.addEventListener("click", function (event) {
    if (event.target === serviceModal) serviceModal.classList.remove("active");
});

if (servicesTableBody) servicesTableBody.addEventListener("click", async function (event) {
    const editButton = event.target.closest(".edit-service-button");
    const deleteButton = event.target.closest(".delete-service-button");

    if (editButton) {
        const { data } = await supabaseClient.from("services").select("*").eq("id", editButton.dataset.serviceId).single();
        if (data) abrirModalServicio(data);
    }

    if (deleteButton && confirm(`¿Seguro que quieres eliminar ${deleteButton.dataset.serviceName}?`)) {
        const { error } = await supabaseClient.from("services").delete().eq("id", deleteButton.dataset.serviceId);
        if (error) {
            alert("No se ha podido eliminar el servicio: " + error.message);
            return;
        }
        await cargarServicios();
        await cargarDatosDashboard();
    }
});

if (serviceForm) serviceForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const button = serviceForm.querySelector('button[type="submit"]');
    const message = document.getElementById("serviceFormMessage");
    const serviceId = document.getElementById("serviceId").value;
    const payload = {
        nombre: document.getElementById("serviceName").value.trim(),
        descripcion: document.getElementById("serviceDescription").value.trim() || null,
        duracion_minutos: Number(document.getElementById("serviceDuration").value),
        precio: Number(document.getElementById("servicePrice").value),
        visible_web: document.getElementById("serviceVisibleWeb").checked,
        permite_reserva: document.getElementById("serviceAllowsBooking").checked,
        disponible_tpv: document.getElementById("serviceAvailableTpv").checked,
        activo: document.getElementById("serviceActive").checked
    };

    button.disabled = true;
    try {
        const request = serviceId
            ? supabaseClient.from("services").update(payload).eq("id", serviceId)
            : supabaseClient.from("services").insert(payload);
        const { error } = await request;
        if (error) throw error;
        message.textContent = "Servicio guardado correctamente.";
        message.style.color = "#397247";
        await cargarServicios();
        await cargarServiciosEnReserva();
        await cargarDatosDashboard();
        setTimeout(function () { serviceModal.classList.remove("active"); }, 600);
    } catch (error) {
        message.textContent = error.message || "No se ha podido guardar el servicio.";
        message.style.color = "#a65b45";
    } finally {
        button.disabled = false;
    }
});


/* =========================================================
   PERFIL PERSONAL
========================================================= */

function cargarPerfilForm() {
    if (!profile) return;
    document.getElementById("profileName").value = profile.nombre || "";
    document.getElementById("profileSurname").value = profile.apellidos || "";
    document.getElementById("profilePhone").value = profile.telefono || "";
    const avatar = document.getElementById("profileAvatarPreview");
    if (avatar) avatar.textContent = (profile.nombre || "M").charAt(0).toUpperCase();
}

if (profileForm) profileForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = document.getElementById("profileFormMessage");
    const payload = {
        nombre: document.getElementById("profileName").value.trim(),
        apellidos: document.getElementById("profileSurname").value.trim() || null,
        telefono: document.getElementById("profilePhone").value.trim() || null
    };

    const { data, error } = await supabaseClient
        .from("profiles")
        .update(payload)
        .eq("id", profile.id)
        .select("id, nombre, apellidos, telefono, rol, activo")
        .single();

    if (error) {
        message.textContent = error.message || "No se han podido guardar los cambios.";
        message.style.color = "#a65b45";
        return;
    }

    profile = data;
    cargarPerfilForm();
    if (userName) userName.textContent = nombreCompleto(profile);
    message.textContent = "Datos guardados correctamente.";
    message.style.color = "#397247";
});


/* =========================================================
   BOTÓN ELIMINAR
========================================================= */

if (professionalsTableBody) {

    professionalsTableBody.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".delete-professional-button"
                );


            if (!button) {
                return;
            }


            const profesionalId =
                button.dataset.professionalId;
                console.log(
    "ID QUE VOY A ELIMINAR:",
    profesionalId
);


            const nombreProfesional =
                button.dataset.professionalName ||
                "este profesional";


            eliminarProfesional(
                profesionalId,
                nombreProfesional
            );

        }
    );
}


/* =========================================================
   BÚSQUEDA DE PROFESIONALES
========================================================= */

const professionalSearch =
    document.getElementById(
        "professionalSearch"
    );


const professionalFilter =
    document.getElementById(
        "professionalFilter"
    );


let profesionalesCache = [];


async function cargarProfesionalesConFiltro() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("professionals")
                .select("id, profile_id, nombre, apellidos, activo")
                .order("nombre", { ascending: true });


        if (error) {
            throw error;
        }


        profesionalesCache =
            data || [];


        aplicarFiltroProfesionales();

    } catch (error) {

        console.error(
            "Error cargando profesionales:",
            error
        );
    }
}


function aplicarFiltroProfesionales() {

    if (!professionalsTableBody) {
        return;
    }


    const texto =
        professionalSearch
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtro =
        professionalFilter?.value ||
        "todos";


    let lista =
        [...profesionalesCache];


    if (texto) {

        lista =
            lista.filter(
                function (professional) {

                    const nombre =
                        nombreCompleto(
                            professional
                        )
                            .toLowerCase();


                    return nombre.includes(
                        texto
                    );

                }
            );
    }


    if (filtro === "activos") {

        lista =
            lista.filter(
                function (professional) {

                    return professional.activo !==
                        false;

                }
            );
    }


    if (filtro === "inactivos") {

        lista =
            lista.filter(
                function (professional) {

                    return professional.activo ===
                        false;

                }
            );
    }


    if (lista.length === 0) {

        professionalsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-loading"
                >
                    No se han encontrado profesionales.
                </td>
            </tr>
        `;

        return;
    }


    professionalsTableBody.innerHTML =
        lista.map(
            function (professional) {

                const nombre =
                    nombreCompleto(
                        professional
                    );


                const inicial =
                    (
                        professional.nombre ||
                        "?"
                    )
                        .charAt(0)
                        .toUpperCase();


                const rol =
                    professional.rol ===
                    "administrador"
                        ? "Administrador"
                        : "Profesional";


                const activo =
                    professional.activo !==
                    false;


                const estado =
                    activo
                        ? "Activo"
                        : "Inactivo";


                const estadoClase =
                    activo
                        ? "status-active"
                        : "status-inactive";


                return `
                    <tr>

                        <td>

                            <div class="professional-name">

                                <div class="professional-avatar">
                                    ${escaparHTML(inicial)}
                                </div>

                                <div>
                                    <strong>
                                        ${escaparHTML(nombre)}
                                    </strong>
                                </div>

                            </div>

                        </td>

                        <td>
                            ${
                                escaparHTML(
                                    professional.telefono ||
                                    "—"
                                )
                            }
                        </td>

                        <td>
                            ${escaparHTML(rol)}
                        </td>

                        <td>

                            <span
                                class="status-badge ${estadoClase}"
                            >
                                ${estado}
                            </span>

                        </td>

                        <td>

                            ${
                                profile &&
                                profile.rol ===
                                "propietario"

                                ?

                                `
                                <button
                                    class="table-action-button delete-professional-button"
                                    type="button"
                                    data-professional-id="${escaparHTML(professional.id)}"
                                    data-professional-name="${escaparHTML(nombre)}"
                                >
                                    Eliminar
                                </button>
                                `

                                :

                                `
                                <button
                                    class="table-action-button"
                                    type="button"
                                    disabled
                                >
                                    Gestionar
                                </button>
                                `
                            }

                        </td>

                    </tr>
                `;

            }
        )
        .join("");
}


if (professionalSearch) {

    professionalSearch.addEventListener(
        "input",
        aplicarFiltroProfesionales
    );
}


if (professionalFilter) {

    professionalFilter.addEventListener(
        "change",
        aplicarFiltroProfesionales
    );
}


/* =========================================================
   RESERVAS
========================================================= */

const appointmentsTableBody =
    document.getElementById(
        "appointmentsTableBody"
    );


const newAppointmentButton =
    document.getElementById(
        "newAppointmentButton"
    );


const addAppointmentButton =
    document.getElementById(
        "addAppointmentButton"
    );


const appointmentModal =
    document.getElementById(
        "appointmentModal"
    );


const closeAppointmentModal =
    document.getElementById(
        "closeAppointmentModal"
    );


const appointmentForm =
    document.getElementById(
        "appointmentForm"
    );


/* =========================================================
   CARGAR RESERVAS
========================================================= */

async function cargarReservas() {

    if (!appointmentsTableBody) {
        return;
    }


    appointmentsTableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="table-loading"
            >
                Cargando reservas...
            </td>
        </tr>
    `;


    try {

        const {
            data: appointments,
            error: appointmentsError
        } =
            await supabaseClient
                .from("appointments")
                .select("*")
                .neq("estado", "cancelada")
                .order(
                    "fecha_hora_inicio",
                    {
                        ascending:
                            true
                    }
                );


        if (appointmentsError) {

            throw appointmentsError;
        }


        const {
            data: clients,
            error: clientsError
        } =
            await supabaseClient
                .from("clients")
                .select(
                    "id, nombre, apellidos, email, telefono"
                );


        const {
            data: professionals,
            error: professionalsError
        } =
            await supabaseClient
                .from("professionals")
                .select(
                    "id, nombre, apellidos, activo"
                );


        const {
            data: services,
            error: servicesError
        } =
            await supabaseClient
                .from("services")
                .select(
                    "id, nombre"
                );


        console.log(
            "RESERVAS:",
            appointments
        );

        console.log(
            "CLIENTES:",
            clients
        );

        console.log(
            "PROFESIONALES:",
            professionals
        );

        console.log(
            "SERVICIOS:",
            services
        );


        if (
            clientsError ||
            professionalsError ||
            servicesError
        ) {

            console.warn(
                "Alguno de los datos relacionados no se pudo cargar.",
                {
                    clientsError,
                    professionalsError,
                    servicesError
                }
            );
        }


        if (
            !appointments ||
            appointments.length === 0
        ) {

            appointmentsTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="table-loading"
                    >
                        Todavía no hay reservas.
                    </td>
                </tr>
            `;

            return;
        }


        appointmentsTableBody.innerHTML =
            appointments
                .map(
                    function (appointment) {

                        const cliente =
                            (
                                clients ||
                                []
                            ).find(
                                function (client) {

                                    return (
                                        client.id ===
                                        appointment.client_id
                                    );

                                }
                            );


                        const profesional =
                            (
                                professionals ||
                                []
                            ).find(
                                function (professional) {

                                    return (
                                        professional.id ===
                                        appointment.professional_id
                                    );

                                }
                            );


                        const servicio =
                            (
                                services ||
                                []
                            ).find(
                                function (service) {

                                    return (
                                        service.id ===
                                        appointment.service_id
                                    );

                                }
                            );


                        return `
                            <tr>

                                <td>
                                    ${
                                        escaparHTML(
                                            appointment.fecha_hora_inicio ||
                                            "—"
                                        )
                                    }
                                </td>

                                <td>
                                    ${
                                        escaparHTML(
                                            appointment.fecha_hora_fin ||
                                            "—"
                                        )
                                    }
                                </td>

                                <td>
                                    ${
                                        escaparHTML(
                                            nombreCompleto(
                                                cliente
                                            )
                                        )
                                    }
                                </td>

                                <td class="appointment-contact">
                                    ${
                                        cliente?.telefono
                                            ? `<a href="tel:${escaparHTML(cliente.telefono)}">${escaparHTML(cliente.telefono)}</a>`
                                            : "—"
                                    }
                                    ${
                                        cliente?.email
                                            ? `<a href="mailto:${escaparHTML(cliente.email)}">${escaparHTML(cliente.email)}</a>`
                                            : "—"
                                    }
                                </td>

                                <td>
                                    ${
                                        escaparHTML(
                                            nombreCompleto(
                                                profesional
                                            )
                                        )
                                    }
                                </td>

                                <td>
                                    ${
                                        escaparHTML(
                                            servicio?.nombre ||
                                            "—"
                                        )
                                    }
                                </td>

                                <td>
                                    ${
                                        escaparHTML(
                                            appointment.estado ||
                                            "—"
                                        )
                                    }
                                </td>

                                <td>
                                    ${
                                        appointment.estado === "pendiente"
                                            ? `
                                                <button class="table-action-button confirm-appointment-button" type="button" data-appointment-id="${escaparHTML(appointment.id)}" data-client-email="${escaparHTML(cliente?.email || "")}" data-client-phone="${escaparHTML(cliente?.telefono || "")}\">
                                                    Confirmar
                                                </button>
                                                <button class="table-action-button cancel-appointment-button" type="button" data-appointment-id="${escaparHTML(appointment.id)}">
                                                    Cancelar
                                                </button>
                                            `
                                            : ""
                                    }
                                    <button class="table-action-button delete-appointment-button" type="button" data-appointment-id="${escaparHTML(appointment.id)}">
                                        Eliminar
                                    </button>
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");


    } catch (error) {

        console.error(
            "ERROR CARGANDO RESERVAS:",
            error
        );


        appointmentsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-loading"
                >
                    No se han podido cargar las reservas.
                </td>
            </tr>
        `;
    }
}

async function notificarReservaDesdePanel(payload) {
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/notify-appointment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.error || result.message || `La función de correo respondió ${response.status}.`);
        }

        return { ok: result.ok === true || result.success === true };
    } catch (error) {
        console.warn("No se pudo enviar el correo de reserva:", error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : "No se pudo enviar el correo."
        };
    }
}

if (appointmentsTableBody) appointmentsTableBody.addEventListener("click", async function (event) {
    const confirmButton = event.target.closest(".confirm-appointment-button");
    const cancelButton = event.target.closest(".cancel-appointment-button");
    const deleteButton = event.target.closest(".delete-appointment-button");
    const button = confirmButton || cancelButton || deleteButton;
    if (!button) return;

    if (deleteButton) {
        if (!confirm("¿Seguro que quieres eliminar esta reserva? Esta acción no se puede deshacer.")) return;
        button.disabled = true;

        const { error: deleteError } = await supabaseClient.rpc(
            "eliminar_reserva",
            { p_reserva_id: Number(button.dataset.appointmentId) }
        );

        if (deleteError) {
            const { error: cancelError } = await supabaseClient
                .from("appointments")
                .update({ estado: "cancelada" })
                .eq("id", button.dataset.appointmentId);

            if (cancelError) {
                alert(cancelError.message || "No se ha podido eliminar la reserva.");
                button.disabled = false;
                return;
            }
        }

        await cargarReservas();
        await cargarDatosDashboard();
        return;
    }

    const nextStatus = confirmButton ? "confirmada" : "cancelada";
    button.disabled = true;

    const { error } = await supabaseClient
        .from("appointments")
        .update({ estado: nextStatus })
        .eq("id", button.dataset.appointmentId);

    if (error) {
        alert(error.message || "No se ha podido actualizar la reserva.");
        button.disabled = false;
        return;
    }

    const resultadoCorreo = await notificarReservaDesdePanel({
        appointmentId: button.dataset.appointmentId,
        clientEmail: confirmButton ? button.dataset.clientEmail : "",
        clientPhone: button.dataset.clientPhone || "",
        type: nextStatus
    });

    if (!resultadoCorreo.ok) {
        alert(`La reserva se ha actualizado, pero no se ha enviado el correo: ${resultadoCorreo.error}`);
    }

    await cargarReservas();
    await cargarDatosDashboard();
});


/* =========================================================
   PROFESIONALES EN DESPLEGABLE DE RESERVA
========================================================= */

async function cargarProfesionalesEnReserva() {

    const select =
        document.getElementById(
            "appointmentProfessional"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Cargando profesionales...
        </option>
    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("professionals")
                .select(
                    "id, nombre, apellidos, activo"
                )
                .eq(
                    "activo",
                    true
                )
                .order(
                    "nombre",
                    {
                        ascending:
                            true
                    }
                );


        console.log(
            "PROFESIONALES PARA RESERVA:",
            data
        );


        if (error) {

            throw error;
        }


        select.innerHTML = `
            <option value="">
                Seleccionar profesional
            </option>
        `;


        if (
            !data ||
            data.length === 0
        ) {

            select.innerHTML = `
                <option value="">
                    No hay profesionales activos
                </option>
            `;

            return;
        }


        data.forEach(
            function (professional) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    professional.id;


                option.textContent =
                    nombreCompleto(
                        professional
                    );


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "ERROR CARGANDO PROFESIONALES EN RESERVA:",
            error
        );


        select.innerHTML = `
            <option value="">
                Error al cargar profesionales
            </option>
        `;
    }
}


/* =========================================================
   SERVICIOS EN DESPLEGABLE DE RESERVA
========================================================= */

async function cargarServiciosEnReserva() {

    const select =
        document.getElementById(
            "appointmentService"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Cargando servicios...
        </option>
    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("services")
                .select(
                    "id, nombre"
                )
                .order(
                    "nombre",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            throw error;
        }


        select.innerHTML = `
            <option value="">
                Seleccionar servicio
            </option>
        `;


        if (
            !data ||
            data.length === 0
        ) {

            select.innerHTML = `
                <option value="">
                    No hay servicios
                </option>
            `;

            return;
        }


        data.forEach(
            function (service) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    service.id;


                option.textContent =
                    service.nombre;


                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "ERROR CARGANDO SERVICIOS:",
            error
        );


        select.innerHTML = `
            <option value="">
                Error al cargar servicios
            </option>
        `;
    }
}


/* =========================================================
   ABRIR NUEVA RESERVA
========================================================= */

async function abrirModalReserva() {

    if (!appointmentModal) {
        return;
    }


    appointmentModal.classList.add(
        "active"
    );


    await Promise.all([
        cargarProfesionalesEnReserva(),
        cargarServiciosEnReserva()
    ]);

}


/* =========================================================
   CERRAR NUEVA RESERVA
========================================================= */

function cerrarModalReserva() {

    if (!appointmentModal) {
        return;
    }


    appointmentModal.classList.remove(
        "active"
    );
}


if (newAppointmentButton) {

    newAppointmentButton.addEventListener(
        "click",
        abrirModalReserva
    );
}


if (
    addAppointmentButton &&
    addAppointmentButton !==
    newAppointmentButton
) {

    addAppointmentButton.addEventListener(
        "click",
        abrirModalReserva
    );
}


if (closeAppointmentModal) {

    closeAppointmentModal.addEventListener(
        "click",
        cerrarModalReserva
    );
}


if (appointmentModal) {

    appointmentModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                appointmentModal
            ) {

                cerrarModalReserva();
            }

        }
    );
}


/* =========================================================
   CREAR RESERVA
========================================================= */

if (appointmentForm) {

    appointmentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "appointmentFormMessage"
                );


            const submitButton =
                appointmentForm.querySelector(
                    'button[type="submit"]'
                );


            const clientText =
                document.getElementById(
                    "appointmentClient"
                )?.value.trim();


            const professionalId =
                document.getElementById(
                    "appointmentProfessional"
                )?.value;


            const serviceId =
                document.getElementById(
                    "appointmentService"
                )?.value;


            const date =
                document.getElementById(
                    "appointmentDate"
                )?.value;


            const startTime =
                document.getElementById(
                    "appointmentStartTime"
                )?.value;


            const endTime =
                document.getElementById(
                    "appointmentEndTime"
                )?.value;


            const status =
                document.getElementById(
                    "appointmentStatus"
                )?.value ||
                "pendiente";


            const paymentMethod =
                document.getElementById(
                    "appointmentPaymentMethod"
                )?.value ||
                null;


            if (message) {

                message.textContent =
                    "";
            }


            /*
             * El HTML actual utiliza texto para
             * cliente, no client_id.
             *
             * Por seguridad no intentamos crear
             * una reserva con una estructura que
             * no conocemos.
             */

            if (
                !professionalId ||
                !serviceId ||
                !date ||
                !startTime
            ) {

                if (message) {

                    message.style.color =
                        "#a65b43";

                    message.textContent =
                        "Completa profesional, servicio, fecha y hora.";
                }

                return;
            }


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Creando...";
            }


            try {

                /*
                 * Buscar cliente por nombre si existe.
                 */

                let clientId = null;


                if (clientText) {

                    const partes =
                        clientText
                            .split(" ")
                            .filter(Boolean);


                    const nombreBuscado =
                        partes[0];


                    const {
                        data: clientMatches,
                        error: clientError
                    } =
                        await supabaseClient
                            .from("clients")
                            .select(
                                "id, nombre, apellidos"
                            )
                            .ilike(
                                "nombre",
                                `%${nombreBuscado}%`
                            )
                            .limit(10);


                    if (
                        !clientError &&
                        clientMatches &&
                        clientMatches.length === 1
                    ) {

                        clientId =
                            clientMatches[0].id;
                    }
                }


                const fechaInicio =
                    `${date}T${startTime}:00`;


                let fechaFin =
                    null;


                if (endTime) {

                    fechaFin =
                        `${date}T${endTime}:00`;
                }

                if (!fechaFin) {
                    const { data: selectedService, error: serviceError } =
                        await supabaseClient
                            .from("services")
                            .select("duracion_minutos")
                            .eq("id", Number(serviceId))
                            .single();

                    if (serviceError) {
                        throw serviceError;
                    }

                    const startDate = new Date(fechaInicio);
                    const endDate = new Date(
                        startDate.getTime() +
                        Number(selectedService.duracion_minutos || 60) *
                        60000
                    );

                    fechaFin =
                        `${date}T${String(endDate.getHours()).padStart(2, "0")}:` +
                        `${String(endDate.getMinutes()).padStart(2, "0")}:00`;
                }


                const appointmentData = {

                    professional_id:
                        Number(
                            professionalId
                        ),

                    service_id:
                        Number(
                            serviceId
                        ),

                    fecha_hora_inicio:
                        fechaInicio,

                    fecha_hora_fin:
                        fechaFin,

                    estado:
                        status,

                    metodo_pago:
                        paymentMethod

                };


                if (clientId) {

                    appointmentData.client_id =
                        clientId;
                }


                console.log(
                    "DATOS NUEVA RESERVA:",
                    appointmentData
                );


                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("appointments")
                        .insert(
                            appointmentData
                        )
                        .select()
                        .single();


                if (error) {

                    throw error;
                }


                console.log(
                    "RESERVA CREADA:",
                    data
                );


                if (message) {

                    message.style.color =
                        "#397247";

                    message.textContent =
                        "Reserva creada correctamente.";
                }


                appointmentForm.reset();


                await cargarReservas();


                setTimeout(
                    function () {

                        cerrarModalReserva();

                        if (message) {

                            message.textContent =
                                "";
                        }

                    },
                    1000
                );


            } catch (error) {

                console.error(
                    "ERROR CREANDO RESERVA:",
                    error
                );


                if (message) {

                    message.style.color =
                        "#a65b43";

                    message.textContent =
                        error.message ||
                        "No se ha podido crear la reserva.";
                }

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Crear reserva";
                }

            }

        }
    );

}


/* =========================================================
   TPV Y FACTURACIÓN
========================================================= */

const saleForm = document.getElementById("saleForm");
const saleService = document.getElementById("saleService");
const salesTableBody = document.getElementById("salesTableBody");
const invoicesTableBody = document.getElementById("invoicesTableBody");
const exportSalesButton = document.getElementById("exportSalesButton");
const salesTotalAmount = document.getElementById("salesTotalAmount");
let ventasCache = [];

async function cargarServiciosEnTpv() {
    if (!saleService) return;

    const { data, error } = await supabaseClient
        .from("services")
        .select("id, nombre, precio, disponible_tpv, activo")
        .eq("activo", true)
        .eq("disponible_tpv", true)
        .order("nombre", { ascending: true });

    saleService.innerHTML = error
        ? '<option value="">No se han podido cargar los servicios</option>'
        : '<option value="">Seleccionar servicio</option>';

    (data || []).forEach(function (service) {
        const option = document.createElement("option");
        option.value = service.precio || 0;
        option.textContent = `${service.nombre} (${Number(service.precio || 0).toFixed(2)} €)`;
        saleService.appendChild(option);
    });
}

if (saleService) saleService.addEventListener("change", function () {
    document.getElementById("saleTotal").value = saleService.value || "";
});

function pintarVentas() {
    const rows = ventasCache.map(function (sale) {
        const date = sale.created_at ? new Date(sale.created_at).toLocaleString("es-ES") : "—";
        return `<tr><td>${escaparHTML(date)}</td><td>${Number(sale.total || 0).toFixed(2)} €</td><td>${escaparHTML(sale.metodo_pago || "—")}</td></tr>`;
    }).join("");

    const invoiceRows = ventasCache.map(function (sale) {
        const date = sale.created_at ? new Date(sale.created_at).toLocaleString("es-ES") : "—";
        return `<tr><td>V-${String(sale.id).padStart(6, "0")}</td><td>${escaparHTML(date)}</td><td>${Number(sale.total || 0).toFixed(2)} €</td><td>${escaparHTML(sale.metodo_pago || "—")}</td><td><button class="table-action-button print-sale-button" type="button" data-sale-id="${escaparHTML(sale.id)}">Imprimir</button></td></tr>`;
    }).join("");

    if (salesTableBody) salesTableBody.innerHTML = rows || '<tr><td colspan="3" class="table-loading">Todavía no hay ventas.</td></tr>';
    if (invoicesTableBody) invoicesTableBody.innerHTML = invoiceRows || '<tr><td colspan="5" class="table-loading">Todavía no hay documentos.</td></tr>';
    if (salesTotalAmount) {
        const total = ventasCache.reduce(function (sum, sale) {
            return sum + Number(sale.total || 0);
        }, 0);
        salesTotalAmount.textContent = total.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR"
        });
    }
}

async function cargarVentas() {
    const { data, error } = await supabaseClient
        .from("sales")
        .select("id, created_at, total, metodo_pago, client_id, professional_id")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error cargando ventas:", error);
        if (salesTableBody) salesTableBody.innerHTML = '<tr><td colspan="3" class="table-loading">No se han podido cargar las ventas.</td></tr>';
        if (invoicesTableBody) invoicesTableBody.innerHTML = '<tr><td colspan="5" class="table-loading">No se han podido cargar los documentos.</td></tr>';
        return;
    }

    ventasCache = data || [];
    pintarVentas();
}

if (saleForm) saleForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = document.getElementById("saleFormMessage");
    const button = saleForm.querySelector('button[type="submit"]');
    const clientName = document.getElementById("saleClientName").value.trim();
    const clientPhone = document.getElementById("saleClientPhone").value.trim();
    const total = Number(document.getElementById("saleTotal").value);
    const method = document.getElementById("salePaymentMethod").value;

    if (!Number.isFinite(total) || total < 0) {
        message.textContent = "Introduce un importe válido.";
        message.style.color = "#a65b45";
        return;
    }

    if (!clientName || !clientPhone) {
        message.textContent = "Indica el nombre y el teléfono del cliente.";
        message.style.color = "#a65b45";
        return;
    }

    button.disabled = true;
    let clientId = null;
    const { data: existingClient } = await supabaseClient
        .from("clients")
        .select("id")
        .eq("telefono", clientPhone)
        .limit(1)
        .maybeSingle();

    if (existingClient?.id) {
        clientId = existingClient.id;
    } else {
        const clientParts = clientName.split(/\s+/);
        const { data: newClient, error: clientError } = await supabaseClient
            .from("clients")
            .insert({
                nombre: clientParts.shift(),
                apellidos: clientParts.join(" ") || null,
                telefono: clientPhone
            })
            .select("id")
            .single();

        if (clientError) {
            button.disabled = false;
            message.textContent = clientError.message || "No se ha podido guardar el cliente.";
            message.style.color = "#a65b45";
            return;
        }
        clientId = newClient.id;
    }

    const { data: professional } = await supabaseClient
        .from("professionals")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();

    const payload = { total, metodo_pago: method, client_id: clientId };
    if (professional?.id) payload.professional_id = professional.id;

    const { error } = await supabaseClient.from("sales").insert(payload);
    button.disabled = false;

    if (error) {
        message.textContent = error.message || "No se ha podido registrar el cobro.";
        message.style.color = "#a65b45";
        return;
    }

    message.textContent = "Cobro registrado correctamente.";
    message.style.color = "#397247";
    saleForm.reset();
    await cargarVentas();
});

if (exportSalesButton) exportSalesButton.addEventListener("click", function () {
    const lines = ["Referencia,Fecha,Importe,Metodo de pago"];
    ventasCache.forEach(function (sale) {
        lines.push([`V-${String(sale.id).padStart(6, "0")}`, sale.created_at || "", sale.total || 0, sale.metodo_pago || ""].map(function (value) {
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(","));
    });
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ventas-mente-amante.csv";
    link.click();
    URL.revokeObjectURL(link.href);
});

if (invoicesTableBody) invoicesTableBody.addEventListener("click", function (event) {
    const button = event.target.closest(".print-sale-button");
    if (!button) return;
    const sale = ventasCache.find(function (item) { return String(item.id) === String(button.dataset.saleId); });
    if (!sale) return;
    const printWindow = window.open("", "_blank", "width=700,height=700");
    printWindow.document.write(`<h1>Mente Amante</h1><p>Documento de venta V-${sale.id}</p><p>Fecha: ${sale.created_at || ""}</p><p>Total: ${Number(sale.total || 0).toFixed(2)} €</p><p>Método de pago: ${sale.metodo_pago || "—"}</p>`);
    printWindow.document.close();
    printWindow.print();
});


/* =========================================================
   DASHBOARD
========================================================= */

async function cargarDatosDashboard() {

    try {

        /* =====================================
           PROFESIONALES
        ===================================== */

        const {
            data: professionals
        } =
            await supabaseClient
                .from("professionals")
                .select(
                    "id, activo"
                );


        const professionalsCount =
            document.getElementById(
                "professionalsCount"
            );


        if (professionalsCount) {

            professionalsCount.textContent =
                (
                    professionals ||
                    []
                )
                    .filter(
                        function (professional) {

                            return professional.activo !==
                                false;

                        }
                    )
                    .length;
        }


        /* =====================================
           SERVICIOS
        ===================================== */

        const {
            data: services
        } =
            await supabaseClient
                .from("services")
                .select(
                    "id"
                );


        const servicesCount =
            document.getElementById(
                "servicesCount"
            );


        if (servicesCount) {

            servicesCount.textContent =
                (
                    services ||
                    []
                ).length;
        }


        /* =====================================
           CLIENTES
        ===================================== */

        const {
            data: clients
        } =
            await supabaseClient
                .from("clients")
                .select(
                    "id"
                );


        const clientsCount =
            document.getElementById(
                "clientsCount"
            );


        if (clientsCount) {

            clientsCount.textContent =
                (
                    clients ||
                    []
                ).length;
        }


        /* =====================================
           RESERVAS PENDIENTES
        ===================================== */

        const {
            data: pending
        } =
            await supabaseClient
                .from("appointments")
                .select(
                    "id, estado"
                )
                .eq(
                    "estado",
                    "pendiente"
                );


        const pendingBookings =
            document.getElementById(
                "pendingBookings"
            );


        if (pendingBookings) {

            pendingBookings.textContent =
                (
                    pending ||
                    []
                ).length;
        }


    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );
    }
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

async function iniciarPanel() {

    console.log(
        "Iniciando panel de Mente Amante..."
    );


    const usuarioCorrecto =
        await comprobarUsuario();


    if (!usuarioCorrecto) {
        return;
    }


    /*
     * Cargamos datos iniciales
     */

    await Promise.allSettled([

        cargarProfesionales(),

        cargarProfesionalesConFiltro(),

        cargarProfesionalesEnReserva(),

        cargarServiciosEnReserva(),

        cargarServiciosEnTpv(),

        cargarReservas(),

        cargarVentas(),

        cargarDatosDashboard()

    ]);


    console.log(
        "Panel iniciado correctamente."
    );
}


/* =========================================================
   ARRANCAR
========================================================= */

iniciarPanel();