(function() {
    // 1. INJECT CSS
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
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease-out;
        }

        /* The Modal Box */
        .modal-content {
            background-color: #ffffff;
            margin: 15% auto;
            padding: 2rem;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            position: relative;
            font-family: 'General Sans', sans-serif; /* Fallback to sans-serif if not loaded */
            text-align: center;
            animation: slideUp 0.3s ease-out;
        }

        /* Close Button */
        .close-modal-btn {
            color: #aaa;
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.2s;
            line-height: 1;
        }
        .close-modal-btn:hover { color: #000; }

        /* Text Styling */
        .modal-header {
            margin-top: 0;
            color: #333;
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        .modal-body {
            color: #555;
            font-size: 1rem;
            line-height: 1.6;
        }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = modalStyles;
    document.head.appendChild(styleSheet);


    // 2. INJECT HTML (Wait for DOM)
    document.addEventListener("DOMContentLoaded", function() {
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

        // Handle Link Clicks
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                modal.style.display = "block";
            });
        });

        // Close Logic
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