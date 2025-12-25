// ================================
//  BLACK FRIDAY COUNTDOWN TIMER
// ================================
(function () {

    function initCountdownTimers() {
        const timers = document.querySelectorAll("[data-countdown]");
        if (!timers.length) return;

        timers.forEach(timer => setupTimer(timer));
    }

    function setupTimer(root) {
        const endDateStr = root.getAttribute("data-countdown");
        const endDate = new Date(endDateStr);

        if (isNaN(endDate.getTime())) {
            console.warn("Countdown: Invalid date:", endDateStr);
            return;
        }

        const daysEl = root.querySelector("[data-days]");
        const hoursEl = root.querySelector("[data-hours]");
        const minutesEl = root.querySelector("[data-minutes]");
        const secondsEl = root.querySelector("[data-seconds]");
        const endedText = root.querySelector(".bf-ended");
        const timerBox = root.querySelector(".bfp-timer");

        function update() {
            const now = new Date();
            const diff = endDate - now;

            // Таймер завершён
            if (diff <= 0) {
                if (window.BOOKS) {
                    window.BOOKS.forEach(b => {
                        b.bfDeal = false;
                        b.bfDiscount = 0;
                    });
                }
                if (window.ProductRepository && window.ProductRepository.books) {
                    window.ProductRepository.books.forEach(b => {
                        b.bfDeal = false;
                        b.bfDiscount = 0;
                    });
                }
                document.dispatchEvent(new CustomEvent("bf:ended"));
                document.body.classList.add("bf-ended");
                const endedBanner = document.querySelector(".bf-ended-banner");
                if (endedBanner) {
                    endedBanner.hidden = false;
                    setTimeout(() => endedBanner.classList.add("show"), 20);
                }
                clearInterval(interval);
                if (timerBox) timerBox.hidden = true;
                if (endedText) endedText.hidden = false;
                
                document.dispatchEvent(new CustomEvent("bf:update-ui"));
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            // const days = 0;
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            // const hours = 0;
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            // const minutes = 0;
            // const seconds = Math.floor((diff / 1000) % 60);

            const seconds = Math.floor((diff / 1000) % 60);

            document.dispatchEvent(new CustomEvent("bf:tick", {
                detail: {
                    root,
                    diff,
                    ended: diff <= 0,
                    days,
                    hours,
                    minutes,
                    seconds
                }
            }));

            updateValue(daysEl, days);
            updateValue(hoursEl, hours);
            updateValue(minutesEl, minutes);
            updateValue(secondsEl, seconds);
        }

        function updateValue(element, value) {
            if (!element) return;
            const newValue = String(value).padStart(2, "0");

            if (element.textContent !== newValue) {
                element.textContent = newValue;

                // Микро-анимация при обновлении цифры
                element.classList.remove("bfv-pop");
                void element.offsetWidth; // Trigger reflow
                element.classList.add("bfv-pop");
            }
        }

        // Первый вызов
        update();

        // Обновляем каждую секунду
        const interval = setInterval(update, 1000);
    }

    // Запуск сразу
    document.addEventListener("DOMContentLoaded", initCountdownTimers);

    document.addEventListener("includes:loaded", initCountdownTimers);

})();
