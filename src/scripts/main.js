function berekenPaasdatum(year) {
    // Meeus/Jones/Butcher algoritme voor Paaszondag
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const maand = Math.floor((h + l - 7 * m + 114) / 31); // 3=maart, 4=april
    const dag = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, maand - 1, dag);
}

function isFeestdag(date) {
    const year = date.getFullYear();

    // Vaste feestdagen
    const vasteFeestdagen = [
        `01-01`, // Nieuwjaar
        `05-01`, // Dag van de Arbeid
        `07-21`, // Nationale feestdag
        `08-15`, // O.L.V. Hemelvaart
        `11-01`, // Allerheiligen
        `11-11`, // Wapenstilstand
        `12-25`, // Kerstmis
    ];

    // Variabele feestdagen
    const paasZondag = berekenPaasdatum(year);
    const paasmaandag = new Date(paasZondag);
    paasmaandag.setDate(paasZondag.getDate() + 1);

    const hemelvaart = new Date(paasZondag);
    hemelvaart.setDate(paasZondag.getDate() + 39);

    const pinkstermaandag = new Date(paasZondag);
    pinkstermaandag.setDate(paasZondag.getDate() + 50);

    const variabeleFeestdagen = [
        `${String(paasmaandag.getMonth() + 1).padStart(2, '0')}-${String(paasmaandag.getDate()).padStart(2, '0')}`, // Paasmaandag
        `${String(hemelvaart.getMonth() + 1).padStart(2, '0')}-${String(hemelvaart.getDate()).padStart(2, '0')}`,   // O.H. Hemelvaart
        `${String(pinkstermaandag.getMonth() + 1).padStart(2, '0')}-${String(pinkstermaandag.getDate()).padStart(2, '0')}`, // Pinkstermaandag
    ];

    const maandDag = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return vasteFeestdagen.includes(maandDag) || variabeleFeestdagen.includes(maandDag);
}

function getHoursForDay(day, isFeestdag) {
    // 0=Zondag, 1=Maandag, ..., 6=Zaterdag
    if (isFeestdag && day === 1) {
        // Maandag op feestdag: weekenduren
        return [[720, 780], [990, 1320]];
    }
    const hours = {
        1: [], // Maandag gesloten
        2: [[990, 1320]], // Dinsdag 16:30-22:00
        3: [[990, 1320]], // Woensdag 16:30-22:00
        4: [[990, 1320]], // Donderdag 16:30-22:00
        5: [[990, 1320]], // Vrijdag 16:30-22:00
        6: [[720, 780], [990, 1320]], // Zaterdag 12:00-13:00 & 16:30-22:00
        0: [[720, 780], [990, 1320]], // Zondag 12:00-13:00 & 16:30-22:00
    };
    // Feestdag op andere dag dan maandag: weekenduren
    if (isFeestdag && day !== 1) return [[720, 780], [990, 1320]];
    return hours[day];
}

function checkRestaurantStatus() {
    const now = new Date();
    const day = now.getDay(); // 0=Zondag, 1=Maandag, ..., 6=Zaterdag
    const hour = now.getHours();
    const min = now.getMinutes();
    const time = hour * 60 + min;
    const statusDiv = document.getElementById('restaurant-status');
    const feestdag = isFeestdag(now);

    const hours = getHoursForDay(day, feestdag);

    // Check of nu open
    let open = false;
    let sluitTijd = null;
    if (hours.length) {
        for (const [start, end] of hours) {
            if (time >= start && time < end) {
                open = true;
                sluitTijd = end;
                break;
            }
        }
    }

    if (open) {
        const sluitUur = String(Math.floor(sluitTijd / 60)).padStart(2, '0');
        const sluitMin = String(sluitTijd % 60).padStart(2, '0');
        statusDiv.textContent = `Nu geopend tot ${sluitUur}:${sluitMin}`;
        statusDiv.className = 'status-open';
    } else {
        // Zoek volgende opening
        let nextDay = day, daysChecked = 0;
        let nextOpen = null;
        let nextOpenDay = null;
        let foundToday = false;
        // Zoek vandaag nog openingsuren later dan nu
        if (hours.length) {
            for (const [start, ] of hours) {
                if (time < start) {
                    nextOpen = start;
                    nextOpenDay = day;
                    foundToday = true;
                    break;
                }
            }
        }
        // Als vandaag geen opening meer, zoek volgende dag
        if (!foundToday) {
            while (daysChecked < 7) {
                nextDay = (nextDay + 1) % 7;
                daysChecked++;
                const nextDate = new Date(now);
                nextDate.setDate(now.getDate() + daysChecked);
                const nextFeestdag = isFeestdag(nextDate);
                const nextHours = getHoursForDay(nextDay, nextFeestdag);
                if (nextHours.length) {
                    nextOpen = nextHours[0][0];
                    nextOpenDay = nextDay;
                    break;
                }
            }
        }
        const dagen = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
        if (nextOpen !== null) {
            const openUur = String(Math.floor(nextOpen / 60)).padStart(2, '0');
            const openMin = String(nextOpen % 60).padStart(2, '0');
            if (nextOpenDay === day && time < nextOpen) {
                statusDiv.textContent = `Open vanaf vandaag ${openUur}:${openMin}`;
            } else {
                statusDiv.textContent = `Open vanaf ${dagen[nextOpenDay]} ${openUur}:${openMin}`;
            }
        } else {
            statusDiv.textContent = 'Gesloten';
        }
        statusDiv.className = 'status-closed';
    }
}

// Run bij laden en elke minuut
checkRestaurantStatus();
setInterval(checkRestaurantStatus, 60000);

// Voeg automatisch het huidige jaar toe aan de footer
document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('footer');
    if (footer) {
        // Zoek of er al een copyright is, anders voeg toe
        if (!footer.innerHTML.includes('&copy;')) {
            footer.innerHTML += `<br>&copy; ${new Date().getFullYear()} Chinees restaurant Hong Kong`;
        } else {
            footer.innerHTML = footer.innerHTML.replace(
                /&copy;\s*\d{4}/,
                `&copy; ${new Date().getFullYear()}`
            );
        }
    }
    const track = document.querySelector(".reviews-track");
  const reviews = document.querySelectorAll(".review");
  const totalReviews = reviews.length;

  // Dupliceer de reviews voor infinite effect
  track.innerHTML += track.innerHTML;
  const allReviews = document.querySelectorAll(".review");

  let currentIndex = 0;
  const reviewStyle = getComputedStyle(allReviews[0]);
  const reviewWidth = allReviews[0].offsetWidth + parseInt(reviewStyle.marginRight);

  function moveSlider() {
    currentIndex++;
    track.style.transition = "transform 0.5s ease";
    track.style.transform = `translateX(-${currentIndex * reviewWidth}px)`;

    if (currentIndex >= totalReviews) {
      setTimeout(() => {
        track.style.transition = "none";
        currentIndex = 0;
        track.style.transform = `translateX(0px)`;
      }, 500);
    }
  }

  setInterval(moveSlider, 3000);

  window.addEventListener("resize", () => {
    const newWidth = allReviews[0].offsetWidth + parseInt(getComputedStyle(allReviews[0]).marginRight);
    track.style.transition = "none";
    track.style.transform = `translateX(-${currentIndex * newWidth}px)`;
  });
});