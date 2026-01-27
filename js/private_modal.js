(function() {
    // 1. INJECT CSS (White Theme + Pixel Units)
    const modalStyles = `
        /* The backdrop */
        .modal-overlay {
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.6); /* Slightly lighter backdrop for white theme */
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease-out;
        }

        /* The Modal Box - WHITE THEME */
        .modal-content {
            background-color: #ffffff !important; /* Force White */
            margin: 15% auto;
            /* Fixed PX padding for consistency */
            padding: 40px 30px; 
            border: 1px solid #e0e0e0;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
            position: relative;
            font-family: 'Satoshi', sans-serif;
            text-align: center;
            animation: slideUp 0.3s ease-out;
        }

        /* Close Button */
        .close-modal-btn {
            color: #aaa;
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 30px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.2s;
            line-height: 1;
        }
        .close-modal-btn:hover { color: #000; } /* Black on hover */

        /* Header */
        .modal-header {
            margin-top: 0;
            /* Fixed px size */
            font-size: 26px; 
            font-weight: 700;
            margin-bottom: 15px;
            
            /* Keep the Gradient Text (Brand) or change to color: #000; for plain black */
            background: -webkit-linear-gradient(90.98deg, rgba(24, 185, 207, 0.9) -2.14%, #6688ff 103.54%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* Body Text */
        .modal-body {
            color: #333333; /* Dark Grey/Black Text */
            /* Fixed px size */
            font-size: 16px; 
            line-height: 1.6;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = modalStyles;
    document.head.appendChild(styleSheet);


    // 2. INJECT HTML
    document.addEventListener("DOMContentLoaded", function() {
        if (document.getElementById("privateRepoModal")) return;

        const modalHTML = `
            <div id="privateRepoModal" class="modal-overlay">
              <div class="modal-content">
                <span class="close-modal-btn">&times;</span>
                <h3 class="modal-header">Access Restricted</h3>
                <p class="modal-body">
                  This repository is private due to organizational confidentiality. 
                  <br><br>
                  Code is available upon request for recruiters and interviewers.
                </p>
              </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 3. ACTIVATE LOGIC
        const modal = document.getElementById("privateRepoModal");
        const closeBtn = document.querySelector(".close-modal-btn");
        const links = document.querySelectorAll(".private-link");

        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                modal.style.display = "block";
            });
        });

        closeBtn.onclick = () => modal.style.display = "none";
        window.onclick = (e) => {
            if (e.target == modal) modal.style.display = "none";
        };
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && modal.style.display === "block") {
                modal.style.display = "none";
            }
        });
    });
})();