const penIcon = document.querySelector('.fa-pen');
const celltypes = document.querySelector('.cell-types');
let leaveTimeout;

const showMenu = () => {
    clearTimeout(leaveTimeout); // Abbrechen, falls gerade ein Schließen geplant war
    celltypes.classList.add('shown');
};

const hideMenu = () => {
    // Kurze Verzögerung (z.B. 200ms), um Zeit zum "Rüberspringen" zu geben
    leaveTimeout = setTimeout(() => {
        celltypes.classList.remove('shown');
    }, 200);
};

// Events für den Stift
penIcon.addEventListener('mouseenter', showMenu);
//penIcon.addEventListener('mouseleave', hideMenu);

// Events für die Liste (damit sie offen bleibt, wenn man sie erreicht)
celltypes.addEventListener('mouseenter', showMenu);
//celltypes.addEventListener('mouseleave', hideMenu);
