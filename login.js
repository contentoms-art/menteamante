const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;


    loginButton.disabled = true;
    loginButton.textContent = "ACCEDIENDO...";
    loginMessage.textContent = "";
    loginMessage.className = "login-message";


    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });


    if (error) {

        console.error("Error de inicio de sesión:", error);

        loginMessage.textContent =
            "El correo o la contraseña no son correctos.";

        loginMessage.classList.add("error");

        loginButton.disabled = false;
        loginButton.textContent = "ACCEDER";

        return;
    }


    console.log("Usuario autenticado:", data.user);


    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("nombre, rol, activo")
            .eq("id", data.user.id)
            .single();


    if (profileError || !profile) {

        console.error(
            "No se pudo obtener el perfil:",
            profileError
        );

        await supabaseClient.auth.signOut();

        loginMessage.textContent =
            "No se ha podido cargar tu perfil.";

        loginMessage.classList.add("error");

        loginButton.disabled = false;
        loginButton.textContent = "ACCEDER";

        return;
    }


    if (!profile.activo) {

        await supabaseClient.auth.signOut();

        loginMessage.textContent =
            "Esta cuenta está desactivada.";

        loginMessage.classList.add("error");

        loginButton.disabled = false;
        loginButton.textContent = "ACCEDER";

        return;
    }


    /*
       Por ahora solamente comprobaremos
       que el usuario y su rol funcionan.
    */

    console.log(
        "Inicio de sesión correcto.",
        "Rol:",
        profile.rol
    );


    loginMessage.textContent =
        "¡Acceso correcto!";

    loginMessage.classList.add("success");


    setTimeout(function () {

        window.location.href = "panel.html";

    }, 800);

});