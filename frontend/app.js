const API_BASE = "http://127.0.0.1:8000";
const USER_ID = 2;

let expenseChart = null;
let allExpenses = [];

let currentSort = {
    field: "expense_date",
    direction: "desc"
};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const userName = document.getElementById("userName");
const totalExpenses = document.getElementById("totalExpenses");
const transactionCount = document.getElementById("transactionCount");
const averageExpense = document.getElementById("averageExpense");
const riskLevel = document.getElementById("riskLevel");
const financialStatus = document.getElementById("financialStatus");
const aiStatus = document.getElementById("aiStatus");
const aiInsights = document.getElementById("aiInsights");
const aiRecommendations = document.getElementById("aiRecommendations");
const highestCategoryBadge =
    document.getElementById("highestCategoryBadge");

const transactionTable =
    document.getElementById("transactionTable");

const statusMessage =
    document.getElementById("statusMessage");

const modal =
    document.getElementById("expenseModal");

const expenseForm =
    document.getElementById("expenseForm");

const expenseAmount =
    document.getElementById("expenseAmount");

const expenseCategory =
    document.getElementById("expenseCategory");

const expenseDescription =
    document.getElementById("expenseDescription");

const expenseDate =
    document.getElementById("expenseDate");

const refreshBtn =
    document.getElementById("refreshBtn");

const addExpenseBtn =
    document.getElementById("addExpenseBtn");

const closeModalBtn =
    document.getElementById("closeModal");

const searchInput =
    document.getElementById("transactionSearch");

const themeToggle =
    document.getElementById("themeToggle");


/* =========================================================
   HELPERS
========================================================= */

function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    ).format(Number(value || 0));

}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showToast(message, type = "success") {

    const existing =
        document.querySelector(".toast");

    if (existing) {
        existing.remove();
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.innerHTML = `
        <span class="toast-icon">
            ${type === "success" ? "✓" : "!"}
        </span>

        <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3000);
}


function setLoading(button, loading, text) {

    if (!button) return;

    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <span class="button-spinner"></span>
            ${text}
        `;

    } else {

        button.disabled = false;

        button.innerHTML =
            button.dataset.originalText ||
            "Refresh";
    }
}


function animateNumber(
    element,
    target,
    formatter = value => value
) {

    if (!element) return;

    const numericTarget =
        Number(target || 0);

    const duration = 700;

    const startTime =
        performance.now();

    const startValue = 0;

    function update(currentTime) {

        const progress =
            Math.min(
                (currentTime - startTime) / duration,
                1
            );

        const eased =
            1 - Math.pow(1 - progress, 3);

        const value =
            startValue +
            (numericTarget - startValue) * eased;

        element.textContent =
            formatter(value);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


function formatMoneyAnimated(value) {

    return money(
        Math.round(value * 100) / 100
    );
}


function getCategoryClass(category) {

    const normalized =
        String(category || "Other")
            .toLowerCase()
            .replace(/\s+/g, "-");

    return `category-${normalized}`;
}


function formatDate(date) {

    if (!date) return "-";

    const parsed =
        new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    setLoading(
        refreshBtn,
        true,
        "Updating..."
    );

    try {

        statusMessage.innerHTML = "";

        const [
            userResponse,
            insightsResponse,
            expensesResponse
        ] = await Promise.all([

            fetch(
                `${API_BASE}/users/${USER_ID}`
            ),

            fetch(
                `${API_BASE}/insights/user/${USER_ID}`
            ),

            fetch(
                `${API_BASE}/expenses/`
            )

        ]);


        if (!userResponse.ok) {

            throw new Error(
                "Could not load user."
            );

        }


        if (!insightsResponse.ok) {

            throw new Error(
                "Could not load financial insights."
            );

        }


        if (!expensesResponse.ok) {

            throw new Error(
                "Could not load expenses."
            );

        }


        const user =
            await userResponse.json();

        const data =
            await insightsResponse.json();

        const expenses =
            await expensesResponse.json();


        renderUser(user);

        renderSummary(data);

        renderAI(data);

        renderChart(data);


        allExpenses =
            Array.isArray(expenses)
                ? expenses.filter(
                    expense =>
                        Number(expense.user_id) ===
                        USER_ID
                )
                : [];


        renderTransactions(
            allExpenses
        );


    } catch (error) {

        console.error(error);

        statusMessage.innerHTML = `
            <div class="status-error">

                <strong>
                    Connection problem
                </strong>

                <span>
                    ${escapeHTML(error.message)}
                </span>

                <small>
                    Make sure the FinPilot backend
                    is running on port 8000.
                </small>

            </div>
        `;

        showToast(
            "Unable to update dashboard.",
            "error"
        );

    } finally {

        setLoading(
            refreshBtn,
            false
        );

    }
}


/* =========================================================
   USER
========================================================= */

function renderUser(user) {

    if (!userName) return;

    userName.textContent =
        user.name || "User";
}


/* =========================================================
   SUMMARY
========================================================= */

function renderSummary(data) {

    animateNumber(
        totalExpenses,
        data.total_expenses,
        formatMoneyAnimated
    );


    animateNumber(
        transactionCount,
        data.transaction_count ?? 0,
        value => Math.round(value)
    );


    animateNumber(
        averageExpense,
        data.average_expense,
        formatMoneyAnimated
    );


    const ai =
        data.ai_analysis || {};


    const risk =
        ai.risk_level ||
        data.risk_level ||
        "--";


    riskLevel.textContent =
        String(risk).toUpperCase();


    financialStatus.textContent =
        `Financial status: ${
            data.financial_status || "--"
        }`;


    if (data.highest_category) {

        highestCategoryBadge.textContent =
            `${data.highest_category} • ${
                data.highest_category_percentage
            }%`;

    } else {

        highestCategoryBadge.textContent =
            "No spending data";

    }


    updateRiskAppearance(risk);
}


/* =========================================================
   RISK APPEARANCE
========================================================= */

function updateRiskAppearance(risk) {

    const normalized =
        String(risk || "")
            .toLowerCase();

    riskLevel.classList.remove(
        "risk-low",
        "risk-medium",
        "risk-high"
    );


    if (
        normalized.includes("low") ||
        normalized.includes("healthy")
    ) {

        riskLevel.classList.add(
            "risk-low"
        );

    } else if (
        normalized.includes("medium") ||
        normalized.includes("moderate")
    ) {

        riskLevel.classList.add(
            "risk-medium"
        );

    } else if (
        normalized.includes("high") ||
        normalized.includes("critical")
    ) {

        riskLevel.classList.add(
            "risk-high"
        );

    }
}


/* =========================================================
   AI ANALYSIS
========================================================= */

function renderAI(data) {

    const ai =
        data.ai_analysis || {};


    const insights =
        ai.insights ||
        data.insights ||
        [];


    const recommendations =
        ai.recommendations ||
        data.recommendations ||
        [];


    const status =
        ai.financial_status ||
        data.financial_status ||
        "Unavailable";


    aiStatus.textContent =
        String(status).toUpperCase();


    aiStatus.classList.remove(
        "ai-healthy",
        "ai-warning",
        "ai-danger"
    );


    const normalized =
        String(status).toLowerCase();


    if (
        normalized.includes("healthy") ||
        normalized.includes("stable")
    ) {

        aiStatus.classList.add(
            "ai-healthy"
        );

    } else if (
        normalized.includes("attention") ||
        normalized.includes("moderate")
    ) {

        aiStatus.classList.add(
            "ai-warning"
        );

    } else {

        aiStatus.classList.add(
            "ai-danger"
        );

    }


    /* -----------------------------------------------------
       INSIGHTS
    ----------------------------------------------------- */

    aiInsights.innerHTML =
        insights.length

            ? insights
                .map(
                    (item, index) => `

                        <div class="insight-item">

                            <span class="insight-number">
                                ${index + 1}
                            </span>

                            <span>
                                ${escapeHTML(item)}
                            </span>

                        </div>

                    `
                )
                .join("")

            : `
                <p class="loading-text">
                    No insights available.
                </p>
            `;


    /* -----------------------------------------------------
       RECOMMENDATIONS
    ----------------------------------------------------- */

    aiRecommendations.innerHTML =
        recommendations.length

            ? recommendations
                .map(
                    item => `

                        <div class="insight-item recommendation">

                            <span class="recommendation-icon">
                                ✓
                            </span>

                            <span>
                                ${escapeHTML(item)}
                            </span>

                        </div>

                    `
                )
                .join("")

            : `
                <p class="loading-text">
                    No recommendations available.
                </p>
            `;
}


/* =========================================================
   CHART
   FIXED VERSION
========================================================= */

function renderChart(data) {

    const breakdown =
        data.category_breakdown || {};


    const labels =
        Object.keys(breakdown);


    const values =
        Object.values(breakdown);


    const canvas =
        document.getElementById(
            "expenseChart"
        );


    if (!canvas) return;


    /* -----------------------------------------------------
       Destroy previous Chart.js instance
    ----------------------------------------------------- */

    if (expenseChart) {

        expenseChart.destroy();

        expenseChart = null;
    }


    /* -----------------------------------------------------
       No data
    ----------------------------------------------------- */

    if (
        !labels.length ||
        !values.length
    ) {

        return;
    }


    /* -----------------------------------------------------
       Get current theme text color
    ----------------------------------------------------- */

    const textColor =
        getComputedStyle(
            document.body
        )
            .getPropertyValue("--text")
            .trim();


    /* -----------------------------------------------------
       Create chart
    ----------------------------------------------------- */

    expenseChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [
                        {

                            data: values,

                            backgroundColor: [

                                "#635bff",
                                "#22c55e",
                                "#f59e0b",
                                "#ec4899",
                                "#06b6d4",
                                "#8b5cf6",
                                "#ef4444",
                                "#64748b"

                            ],

                            borderWidth: 0,

                            /*
                             * Reduced from 14 to 8.
                             * Prevents the chart from jumping
                             * outside the container on hover.
                             */
                            hoverOffset: 8,

                            /*
                             * Limits the maximum doughnut size.
                             * This is one of the important fixes
                             * for the clipping issue.
                             */
                            radius: "78%"
                        }
                    ]
                },


                options: {

                    responsive: true,


                    /*
                     * IMPORTANT
                     *
                     * Allows the chart to use the dimensions
                     * supplied by .chart-container.
                     */
                    maintainAspectRatio: false,


                    /*
                     * Slightly smaller inner hole.
                     */
                    cutout: "68%",


                    /*
                     * Gives the chart breathing room.
                     *
                     * Especially important at the top,
                     * where your screenshot showed clipping.
                     */
                    layout: {

                        padding: {

                            top: 20,
                            right: 20,
                            bottom: 5,
                            left: 20

                        }

                    },


                    /* -------------------------------------------------
                       Animation
                    ------------------------------------------------- */

                    animation: {

                        duration: 900,

                        easing: "easeOutQuart"

                    },


                    /* -------------------------------------------------
                       Interaction
                    ------------------------------------------------- */

                    interaction: {

                        mode: "nearest",

                        intersect: true

                    },


                    /* -------------------------------------------------
                       Plugins
                    ------------------------------------------------- */

                    plugins: {

                        /* ---------------------------------------------
                           LEGEND
                        --------------------------------------------- */

                        legend: {

                            position: "bottom",

                            labels: {

                                usePointStyle: true,

                                pointStyle: "circle",

                                padding: 18,

                                boxWidth: 9,

                                boxHeight: 9,

                                color: textColor,

                                font: {

                                    size: 12,

                                    weight: "500"

                                }

                            }

                        },


                        /* ---------------------------------------------
                           TOOLTIP
                        --------------------------------------------- */

                        tooltip: {

                            enabled: true,

                            backgroundColor:
                                "rgba(15, 23, 42, 0.96)",

                            padding: 12,

                            cornerRadius: 10,

                            displayColors: true,

                            callbacks: {

                                label(context) {

                                    return (
                                        `${context.label}: ` +
                                        money(context.raw)
                                    );

                                }

                            }

                        }

                    }

                }

            }
        );
}


/* =========================================================
   TRANSACTIONS
========================================================= */

function renderTransactions(
    expenses,
    animate = true
) {

    if (!expenses.length) {

        transactionTable.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="empty"
                >

                    <div class="empty-state">

                        <span class="empty-icon">
                            ⌁
                        </span>

                        <strong>
                            No transactions found
                        </strong>

                        <small>
                            Add your first expense to
                            start tracking your finances.
                        </small>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    const sorted =
        [...expenses].sort(
            (a, b) => {

                let first;
                let second;


                if (
                    currentSort.field ===
                    "amount"
                ) {

                    first =
                        Number(
                            a.amount || 0
                        );

                    second =
                        Number(
                            b.amount || 0
                        );

                } else {

                    first =
                        new Date(
                            a.expense_date
                        ).getTime();

                    second =
                        new Date(
                            b.expense_date
                        ).getTime();

                }


                return currentSort.direction ===
                    "asc"

                    ? first - second

                    : second - first;
            }
        );


    transactionTable.innerHTML =
        sorted
            .map(
                (expense, index) => `

                    <tr
                        class="${
                            animate
                                ? "transaction-row"
                                : ""
                        }"

                        style="
                            animation-delay:
                            ${index * 35}ms;
                        "
                    >

                        <td>

                            <span
                                class="
                                    category-pill
                                    ${getCategoryClass(
                                        expense.category
                                    )}
                                "
                            >

                                ${escapeHTML(
                                    expense.category ||
                                    "Other"
                                )}

                            </span>

                        </td>


                        <td>

                            <div class="transaction-description">

                                <strong>

                                    ${escapeHTML(
                                        expense.description ||
                                        "Untitled expense"
                                    )}

                                </strong>

                            </div>

                        </td>


                        <td>

                            <span class="date-text">

                                ${formatDate(
                                    expense.expense_date
                                )}

                            </span>

                        </td>


                        <td class="amount">

                            ${money(
                                expense.amount
                            )}

                        </td>

                    </tr>

                `
            )
            .join("");
}


/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event => {

            const search =
                event.target.value
                    .toLowerCase()
                    .trim();


            const filtered =
                allExpenses.filter(
                    expense => {

                        const category =
                            String(
                                expense.category || ""
                            )
                                .toLowerCase();


                        const description =
                            String(
                                expense.description || ""
                            )
                                .toLowerCase();


                        const date =
                            String(
                                expense.expense_date || ""
                            )
                                .toLowerCase();


                        const amount =
                            String(
                                expense.amount || ""
                            )
                                .toLowerCase();


                        return (

                            category.includes(search) ||

                            description.includes(search) ||

                            date.includes(search) ||

                            amount.includes(search)

                        );

                    }
                );


            renderTransactions(
                filtered,
                false
            );

        }
    );

}


/* =========================================================
   TABLE SORTING
========================================================= */

document
    .querySelectorAll("th")
    .forEach(th => {

        th.style.cursor = "pointer";


        th.addEventListener(
            "click",
            () => {

                const text =
                    th.textContent
                        .trim()
                        .toLowerCase();


                if (
                    text === "date"
                ) {

                    currentSort.field =
                        "expense_date";

                } else if (
                    text === "amount"
                ) {

                    currentSort.field =
                        "amount";

                } else {

                    return;
                }


                currentSort.direction =
                    currentSort.direction ===
                    "asc"

                        ? "desc"

                        : "asc";


                renderTransactions(
                    allExpenses
                );

            }
        );

    });


/* =========================================================
   MODAL
========================================================= */

function openModal() {

    if (!modal) return;


    modal.classList.add("show");


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(() => {

        expenseAmount?.focus();

    }, 150);
}


function closeModal() {

    if (!modal) return;


    modal.classList.remove("show");


    document.body.classList.remove(
        "modal-open"
    );
}


if (addExpenseBtn) {

    addExpenseBtn.addEventListener(
        "click",
        openModal
    );

}


if (closeModalBtn) {

    closeModalBtn.addEventListener(
        "click",
        closeModal
    );

}


if (modal) {

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );

}


/* ---------------------------------------------------------
   ESCAPE KEY
--------------------------------------------------------- */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            modal &&
            modal.classList.contains("show")
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   ADD EXPENSE
========================================================= */

if (expenseForm) {

    expenseForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const amount =
                Number(
                    expenseAmount.value
                );


            if (
                !amount ||
                amount <= 0
            ) {

                showToast(
                    "Please enter a valid amount.",
                    "error"
                );


                expenseAmount.focus();


                return;
            }


            if (!expenseCategory.value) {

                showToast(
                    "Please select a category.",
                    "error"
                );


                expenseCategory.focus();


                return;
            }


            if (!expenseDate.value) {

                showToast(
                    "Please select a date.",
                    "error"
                );


                expenseDate.focus();


                return;
            }


            const expense = {

                amount: amount,

                category:
                    expenseCategory.value,

                description:
                    expenseDescription.value
                        .trim(),

                expense_date:
                    expenseDate.value,

                user_id:
                    USER_ID

            };


            const submitButton =
                expenseForm.querySelector(
                    "button[type='submit']"
                );


            setLoading(
                submitButton,
                true,
                "Adding..."
            );


            try {

                const response =
                    await fetch(
                        `${API_BASE}/expenses/`,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    expense
                                )

                        }
                    );


                if (!response.ok) {

                    const error =
                        await response.text();


                    throw new Error(
                        error ||
                        "Failed to add expense."
                    );

                }


                closeModal();


                expenseForm.reset();


                expenseDate.value =
                    new Date()
                        .toISOString()
                        .split("T")[0];


                showToast(
                    "Expense added successfully."
                );


                await loadDashboard();


            } catch (error) {

                console.error(error);


                showToast(
                    "Could not add expense.",
                    "error"
                );

            } finally {

                setLoading(
                    submitButton,
                    false
                );

            }

        }
    );

}


/* =========================================================
   REFRESH
========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadDashboard
    );

}


/* =========================================================
   DARK MODE
========================================================= */

if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            const dark =
                document.body.classList.contains(
                    "dark"
                );


            themeToggle.innerHTML =
                dark
                    ? "☀ Light Mode"
                    : "☾ Dark Mode";


            localStorage.setItem(
                "finpilot-theme",
                dark
                    ? "dark"
                    : "light"
            );


            /* -------------------------------------------------
               Update chart legend after theme change
            ------------------------------------------------- */

            if (expenseChart) {

                const textColor =
                    getComputedStyle(
                        document.body
                    )
                        .getPropertyValue(
                            "--text"
                        )
                        .trim();


                expenseChart.options
                    .plugins
                    .legend
                    .labels
                    .color =
                    textColor;


                expenseChart.update();

            }

        }
    );

}


/* =========================================================
   LOAD SAVED THEME
========================================================= */

if (
    localStorage.getItem(
        "finpilot-theme"
    ) === "dark"
) {

    document.body.classList.add(
        "dark"
    );


    if (themeToggle) {

        themeToggle.innerHTML =
            "☀ Light Mode";

    }

}


/* =========================================================
   DEFAULT DATE
========================================================= */

if (expenseDate) {

    expenseDate.value =
        new Date()
            .toISOString()
            .split("T")[0];

}


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".nav-item"
                    )
                    .forEach(item =>
                        item.classList.remove(
                            "active"
                        )
                    );


                button.classList.add(
                    "active"
                );

            }
        );

    });


/* =========================================================
   INITIAL LOAD
========================================================= */

loadDashboard();