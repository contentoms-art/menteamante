const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

function cerrarMenu() {
    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
    document.body.classList.remove("menu-open");
}

openMenu.onclick = function () {
    sideMenu.classList.add("active");
    menuOverlay.classList.add("active");
    document.body.classList.add("menu-open");
};

closeMenu.onclick = function () {
    cerrarMenu();
};

menuOverlay.onclick = function () {
    cerrarMenu();
};

sideMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", cerrarMenu);
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        cerrarMenu();
    }
});
/* =================================
   RESERVA ONLINE
================================= */

const bookingModal = document.getElementById("onlineBookingModal");
const bookingForm = document.getElementById("onlineBookingForm");
const bookingEmailLink = document.getElementById("bookingEmailLink");
const bookingWhatsappLink = document.getElementById("bookingWhatsappLink");
const bookingSendOptions = document.getElementById("bookingSendOptions");
const bookingDate = document.getElementById("bookingDate");
const bookingTime = document.getElementById("bookingTime");
const bookingService = document.getElementById("bookingService");
const bookingProfessional = document.getElementById("bookingProfessional");
const datePickerButton = document.getElementById("datePickerButton");
const datePickerPanel = document.getElementById("datePickerPanel");
const datePickerOptions = document.getElementById("datePickerOptions");
const datePickerLabel = document.getElementById("datePickerLabel");
const timePickerButton = document.getElementById("timePickerButton");
const timePickerPanel = document.getElementById("timePickerPanel");
const timePickerOptions = document.getElementById("timePickerOptions");
const timePickerLabel = document.getElementById("timePickerLabel");
const bookingUrl = "https://www.sumupbookings.com/mente-amante";
const toggleServices = document.getElementById("toggleServices");
const extraServiceCards = document.querySelectorAll(".service-card-extra");

toggleServices?.addEventListener("click", function () {
    const showServices = toggleServices.getAttribute("aria-expanded") !== "true";

    extraServiceCards.forEach(function (card) {
        card.hidden = !showServices;
    });

    toggleServices.setAttribute("aria-expanded", String(showServices));
    toggleServices.textContent = showServices
        ? "OCULTAR SERVICIOS"
        : "VER TODOS LOS SERVICIOS";
});

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

async function cargarOpcionesReservaOnline() {
    const [servicesResponse, professionalsResponse] = await Promise.all([
        supabaseClient
            .from("services")
            .select("id, nombre, permite_reserva, activo")
            .eq("activo", true)
            .eq("permite_reserva", true)
            .order("nombre", { ascending: true }),
        supabaseClient
            .from("professionals")
            .select("id, nombre, apellidos, activo")
            .eq("activo", true)
            .order("nombre", { ascending: true })
    ]);

    if (servicesResponse.error || professionalsResponse.error) {
        throw new Error("No se han podido cargar los servicios disponibles.");
    }

    bookingService.innerHTML = '<option value="">Selecciona una asesoría</option>';
    (servicesResponse.data || []).forEach(function (service) {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = service.nombre;
        bookingService.appendChild(option);
    });

    bookingProfessional.innerHTML = '<option value="">Selecciona un profesional</option>';
    (professionalsResponse.data || []).forEach(function (professional) {
        const option = document.createElement("option");
        option.value = professional.id;
        option.textContent = [professional.nombre, professional.apellidos].filter(Boolean).join(" ");
        bookingProfessional.appendChild(option);
    });
}

function formatoFecha(fecha) {
    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, "0"),
        String(fecha.getDate()).padStart(2, "0")
    ].join("-");
}

function nombreDia(dia) {
    return [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado"
    ][dia];
}

function cargarFechasDisponibles() {
    if (!bookingDate || !datePickerOptions) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    datePickerOptions.innerHTML = "";

    for (let indice = 0; indice < 90; indice += 1) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + indice);
        const dia = fecha.getDay();

        if (dia < 1 || dia > 5) continue;

        const option = document.createElement("button");
        option.type = "button";
        option.className = "calendar-option";
        option.value = formatoFecha(fecha);
        option.textContent = `${nombreDia(dia)} ${fecha.getDate()} de ${fecha.toLocaleDateString("es-ES", { month: "long" })}`;
        option.addEventListener("click", function () {
            bookingDate.value = option.value;
            datePickerLabel.textContent = option.textContent;
            datePickerPanel.hidden = true;
            datePickerButton.setAttribute("aria-expanded", "false");
            cargarHorasDisponibles(option.value);
        });
        datePickerOptions.appendChild(option);
    }
}

function cargarHorasDisponibles(fechaSeleccionada) {
    if (!bookingTime) return;

    if (!timePickerOptions) return;

    timePickerOptions.innerHTML = "";
    bookingTime.value = "";
    timePickerLabel.textContent = fechaSeleccionada ? "Selecciona una hora" : "Primero selecciona un día";
    timePickerButton.disabled = !fechaSeleccionada;
    if (!fechaSeleccionada) return;

    const [year, month, day] = fechaSeleccionada.split("-").map(Number);
    const dia = new Date(year, month - 1, day).getDay();
    const ultimaHora = dia === 5 ? 13 * 60 + 30 : 20 * 60;
    const intervalos = [];

    for (let minutos = 11 * 60; minutos <= ultimaHora; minutos += 30) {
        if (dia < 5 && minutos >= 14 * 60 && minutos < 16 * 60) continue;
        intervalos.push(minutos);
    }

    intervalos.forEach(function (minutos) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "time-option";
        const horas = String(Math.floor(minutos / 60)).padStart(2, "0");
        const minutosTexto = String(minutos % 60).padStart(2, "0");
        option.value = `${horas}:${minutosTexto}`;
        option.textContent = `${horas}:${minutosTexto}`;
        option.addEventListener("click", function () {
            bookingTime.value = option.value;
            timePickerLabel.textContent = option.textContent;
            timePickerPanel.hidden = true;
            timePickerButton.setAttribute("aria-expanded", "false");
        });
        timePickerOptions.appendChild(option);
    });
}

cargarFechasDisponibles();

datePickerButton?.addEventListener("click", function () {
    const shouldOpen = datePickerPanel.hidden;
    datePickerPanel.hidden = !shouldOpen;
    datePickerButton.setAttribute("aria-expanded", String(shouldOpen));
    timePickerPanel.hidden = true;
});

timePickerButton?.addEventListener("click", function () {
    if (timePickerButton.disabled) return;
    const shouldOpen = timePickerPanel.hidden;
    timePickerPanel.hidden = !shouldOpen;
    timePickerButton.setAttribute("aria-expanded", String(shouldOpen));
    datePickerPanel.hidden = true;
});

document.addEventListener("click", function (event) {
    if (!event.target.closest(".picker-field")) {
        datePickerPanel.hidden = true;
        timePickerPanel.hidden = true;
    }
});

function cerrarReservaOnline() {
    if (!bookingModal) return;
    bookingModal.classList.remove("active");
    bookingModal.setAttribute("aria-hidden", "true");
}

function reiniciarReservaOnline() {
    if (!bookingForm) return;
    bookingForm.reset();
    bookingSendOptions.hidden = true;
    bookingForm.querySelector('button[type="submit"]').hidden = false;
    document.getElementById("bookingMessage").textContent = "";
    bookingDate.value = "";
    bookingTime.value = "";
    datePickerLabel.textContent = "Selecciona un día";
    timePickerLabel.textContent = "Primero selecciona un día";
    timePickerButton.disabled = true;
    datePickerPanel.hidden = true;
    timePickerPanel.hidden = true;
}

function horarioDisponible(fecha, hora) {
    const partesFecha = fecha.split("-").map(Number);
    const partesHora = hora.split(":").map(Number);
    const dia = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]).getDay();
    const minutos = partesHora[0] * 60 + partesHora[1];

    if (dia >= 1 && dia <= 4) {
        return (minutos >= 660 && minutos < 840) ||
            (minutos >= 960 && minutos <= 1200);
    }

    if (dia === 5) {
        return minutos >= 660 && minutos <= 810;
    }

    return false;
}

document.querySelectorAll(".booking-trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
        event.preventDefault();
        window.location.href = bookingUrl;
    });
});

document.getElementById("closeBookingModal")?.addEventListener("click", function () {
    cerrarReservaOnline();
    reiniciarReservaOnline();
});
bookingModal?.addEventListener("click", function (event) {
    if (event.target === bookingModal) {
        cerrarReservaOnline();
        reiniciarReservaOnline();
    }
});

bookingEmailLink?.addEventListener("click", function () {
    cerrarReservaOnline();
});

bookingWhatsappLink?.addEventListener("click", function () {
    cerrarReservaOnline();
});

if (bookingForm) bookingForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const message = document.getElementById("bookingMessage");
    const button = bookingForm.querySelector('button[type="submit"]');
    const name = document.getElementById("bookingName").value.trim();
    const surname = document.getElementById("bookingSurname").value.trim();
    const email = document.getElementById("bookingEmail").value.trim().toLowerCase();
    const phone = document.getElementById("bookingPhone").value.trim();
    const serviceId = bookingService.value;
    const professionalId = bookingProfessional.value;
    const service = bookingService.options[bookingService.selectedIndex]?.textContent || "";
    const professional = bookingProfessional.options[bookingProfessional.selectedIndex]?.textContent || "";
    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const mode = document.getElementById("bookingMode").value;

    if (!horarioDisponible(date, time)) {
        message.textContent = "El horario disponible es de lunes a jueves de 11:00 a 14:00 y de 16:00 a 20:00, y los viernes de 11:00 a 13:30.";
        message.style.color = "#a65b45";
        return;
    }

    button.disabled = true;

    try {
        const { data: existingClient, error: clientLookupError } = await supabaseClient
            .from("clients")
            .select("id")
            .eq("email", email)
            .limit(1)
            .maybeSingle();

        if (clientLookupError) throw clientLookupError;

        let clientId = existingClient?.id;

        if (!clientId) {
            const { data: newClient, error: clientError } = await supabaseClient
                .from("clients")
                .insert({
                    nombre: name,
                    apellidos: surname || null,
                    email,
                    telefono: phone
                })
                .select("id")
                .single();

            if (clientError) throw clientError;
            clientId = newClient.id;
        } else {
            const { error: updateClientError } = await supabaseClient
                .from("clients")
                .update({ nombre: name, apellidos: surname || null, telefono: phone })
                .eq("id", clientId);

            if (updateClientError) throw updateClientError;
        }

        const { data: selectedService, error: serviceError } = await supabaseClient
            .from("services")
            .select("duracion_minutos")
            .eq("id", Number(serviceId))
            .single();

        if (serviceError) throw serviceError;

        const startDate = new Date(`${date}T${time}:00`);
        const endDate = new Date(
            startDate.getTime() + Number(selectedService.duracion_minutos || 60) * 60000
        );
        const endTime = `${date}T${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}:00`;

        const { data: overlappingAppointments, error: overlapError } = await supabaseClient
            .from("appointments")
            .select("id, fecha_hora_inicio, fecha_hora_fin")
            .eq("professional_id", Number(professionalId))
            .lt("fecha_hora_inicio", endTime)
            .gt("fecha_hora_fin", `${date}T${time}:00`)
            .not("estado", "in", "(cancelada)");

        if (overlapError) throw overlapError;
        if (overlappingAppointments && overlappingAppointments.length > 0) {
            throw new Error("Por favor, escoge otra fecha u hora, porque esta ya está reservada.");
        }

        const { data: appointment, error: appointmentError } = await supabaseClient
            .from("appointments")
            .insert({
                client_id: clientId,
                professional_id: Number(professionalId),
                service_id: Number(serviceId),
                fecha_hora_inicio: `${date}T${time}:00`,
                fecha_hora_fin: endTime,
                estado: "pendiente"
            })
            .select("id")
            .single();

        if (appointmentError) throw appointmentError;

        await enviarAvisoReserva({
            appointmentId: appointment.id,
            clientEmail: email,
            clientPhone: phone,
            type: "new"
        });

        message.textContent = "Solicitud guardada. Elige cómo quieres enviarnos también tus datos.";
        message.style.color = "#397247";
    } catch (error) {
        console.error("Error guardando reserva:", error);
        message.textContent = error.message || "No se ha podido guardar la reserva.";
        message.style.color = "#a65b45";
        button.disabled = false;
        return;
    }

    const messageText = [
        "Hola, me gustaría solicitar una asesoría.",
        "", `Nombre: ${name} ${surname}`.trim(), `Email: ${email}`,
        `Teléfono: ${phone}`, `Servicio: ${service}`,
        `Profesional: ${professional}`, `Fecha preferida: ${date}`,
        `Hora preferida: ${time}`, `Modalidad: ${mode === "online" ? "Online" : "Presencial"}`
    ].join("\n");

    bookingEmailLink.href = `mailto:metodo@menteamante.es?subject=${encodeURIComponent("Solicitud de asesoría")}&body=${encodeURIComponent(messageText)}`;
    bookingWhatsappLink.href = `https://wa.me/34685333562?text=${encodeURIComponent(messageText)}`;
    message.textContent = "Elige cómo quieres enviarnos tu solicitud.";
    message.style.color = "#397247";
    bookingSendOptions.hidden = false;
    button.hidden = true;
});

async function enviarAvisoReserva(payload) {
    try {
        await fetch(`${SUPABASE_URL}/functions/v1/notify-appointment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.warn("No se pudo enviar el aviso automático:", error);
    }
}