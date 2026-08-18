const API_BASE = "http://127.0.0.1:8000";
const USER_ID = 2;

let expenseChart = null;
let allExpenses = [];
let editingExpenseId = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const dashboardView =
    document.getElementById("dashboardView");

const transactionsView =
    document.getElementById("transactionsView");

const dashboardNav =
    document.getElementById("dashboardNav");

const transactionsNav =
    document.getElementById("transactionsNav");

const userName =
    document.getElementById("userName");

const totalExpenses =
    document.getElementById("totalExpenses");

const transactionCount =
    document.getElementById("transactionCount");

const averageExpense =
    document.getElementById("averageExpense");

const riskLevel =
    document.getElementById("riskLevel");

const financialStatus =
    document.getElementById("financialStatus");

const aiStatus =
    document.getElementById("aiStatus");

const aiInsights =
    document.getElementById("aiInsights");

const aiRecommendations =
    document.getElementById("aiRecommendations");

const highestCategoryBadge =
    document.getElementById("highestCategoryBadge");

const transactionTable =
    document.getElementById("transactionTable");

const allTransactionsTable =
    document.getElementById("allTransactionsTable");

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

const expenseModalEyebrow =
    document.getElementById("expenseModalEyebrow");

const expenseModalTitle =
    document.getElementById("expenseModalTitle");

const expenseSubmitBtn =
    document.getElementById("expenseSubmitBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const transactionsRefreshBtn =
    document.getElementById("transactionsRefreshBtn");

const addExpenseBtn =
    document.getElementById("addExpenseBtn");

const transactionsAddExpenseBtn =
    document.getElementById(
        "transactionsAddExpenseBtn"
    );

const closeModalBtn =
    document.getElementById("closeModal");

const dashboardSearch =
    document.getElementById("transactionSearch");

const transactionsSearch =
    document.getElementById("transactionsSearch");

const categoryFilter =
    document.getElementById("categoryFilter");

const transactionSort =
    document.getElementById("transactionSort");

const transactionsResultCount =
    document.getElementById(
        "transactionsResultCount"
    );

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


function formatDate(date) {
    if (!date) return "-";

    const parsed = new Date(date);

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


function getToday() {
    return new Date()
        .toISOString()
        .split("T")[0];
}


function getCategoryClass(category) {
    const normalized = String(category || "Other")
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `category-${normalized}`;
}


function showToast(message, type = "success") {
    const oldToast =
        document.querySelector(".toast");

    if (oldToast) {
        oldToast.remove();
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

        return;
    }

    button.disabled = false;

    if (button.dataset.originalText) {
        button.innerHTML =
            button.dataset.originalText;
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

    const startTime =
        performance.now();

    const duration = 650;

    function update(currentTime) {
        const progress = Math.min(
            (currentTime - startTime) / duration,
            1
        );

        const eased =
            1 - Math.pow(1 - progress, 3);

        element.textContent = formatter(
            numericTarget * eased
        );

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}


/* =========================================================
   DATA LOADING
========================================================= */

async function loadDashboard() {
    setLoading(
        refreshBtn,
        true,
        "Updating..."
    );

    setLoading(
        transactionsRefreshBtn,
        true,
        "Updating..."
    );

    try {
        if (statusMessage) {
            statusMessage.innerHTML = "";
        }

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
                "Could not load user information."
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

        const insights =
            await insightsResponse.json();

        const expenses =
            await expensesResponse.json();

        allExpenses = Array.isArray(expenses)
            ? expenses.filter(
                expense =>
                    Number(expense.user_id) === USER_ID
            )
            : [];

        renderUser(user);
        renderSummary(insights);
        renderAI(insights);
        renderChart(insights);
        renderRecentTransactions(allExpenses);
        renderAllTransactions();

    } catch (error) {
        console.error(error);

        if (statusMessage) {
            statusMessage.innerHTML = `
                <div class="status-error">
                    <strong>Connection problem</strong>

                    <span>
                        ${escapeHTML(error.message)}
                    </span>

                    <small>
                        Make sure the FinPilot backend
                        is running on port 8000.
                    </small>
                </div>
            `;
        }

        showToast(
            "Unable to update dashboard.",
            "error"
        );

    } finally {
        setLoading(refreshBtn, false);
        setLoading(transactionsRefreshBtn, false);
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderUser(user) {
    if (!userName) return;

    userName.textContent =
        user.name || "User";
}


function renderSummary(data) {
    animateNumber(
        totalExpenses,
        data.total_expenses,
        value => money(
            Math.round(value * 100) / 100
        )
    );

    animateNumber(
        transactionCount,
        data.transaction_count ?? 0,
        value => Math.round(value)
    );

    animateNumber(
        averageExpense,
        data.average_expense,
        value => money(
            Math.round(value * 100) / 100
        )
    );

    const ai =
        data.ai_analysis || {};

    const risk =
        ai.risk_level ||
        data.risk_level ||
        "--";

    if (riskLevel) {
        riskLevel.textContent =
            String(risk).toUpperCase();

        riskLevel.classList.remove(
            "risk-low",
            "risk-medium",
            "risk-high"
        );

        const normalized =
            String(risk).toLowerCase();

        if (
            normalized.includes("low") ||
            normalized.includes("healthy")
        ) {
            riskLevel.classList.add("risk-low");

        } else if (
            normalized.includes("medium") ||
            normalized.includes("moderate")
        ) {
            riskLevel.classList.add("risk-medium");

        } else if (
            normalized.includes("high") ||
            normalized.includes("critical")
        ) {
            riskLevel.classList.add("risk-high");
        }
    }

    if (financialStatus) {
        financialStatus.textContent =
            `Financial status: ${
                data.financial_status || "--"
            }`;
    }

    if (highestCategoryBadge) {
        if (data.highest_category) {
            highestCategoryBadge.textContent =
                `${data.highest_category} • ${
                    data.highest_category_percentage
                }%`;
        } else {
            highestCategoryBadge.textContent =
                "No spending data";
        }
    }
}


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

    if (aiStatus) {
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
            aiStatus.classList.add("ai-healthy");

        } else if (
            normalized.includes("attention") ||
            normalized.includes("moderate")
        ) {
            aiStatus.classList.add("ai-warning");

        } else {
            aiStatus.classList.add("ai-danger");
        }
    }

    if (aiInsights) {
        aiInsights.innerHTML = insights.length
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
    }

    if (aiRecommendations) {
        aiRecommendations.innerHTML =
            recommendations.length
                ? recommendations
                    .map(
                        item => `
                            <div
                                class="insight-item recommendation"
                            >
                                <span
                                    class="recommendation-icon"
                                >
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
}


function renderChart(data) {
    const breakdown =
        data.category_breakdown || {};

    const labels =
        Object.keys(breakdown);

    const values =
        Object.values(breakdown);

    const canvas =
        document.getElementById("expenseChart");

    if (!canvas) return;

    if (expenseChart) {
        expenseChart.destroy();
        expenseChart = null;
    }

    if (!labels.length || !values.length) {
        return;
    }

    const textColor =
        getComputedStyle(document.body)
            .getPropertyValue("--text")
            .trim();

    expenseChart = new Chart(
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
                        hoverOffset: 8,
                        radius: "78%"
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",

                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 5,
                        left: 20
                    }
                },

                plugins: {
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

                    tooltip: {
                        backgroundColor:
                            "rgba(15, 23, 42, 0.96)",

                        padding: 12,
                        cornerRadius: 10,

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
   RECENT TRANSACTIONS
========================================================= */

function renderRecentTransactions(expenses) {
    if (!transactionTable) return;

    const sorted = [...expenses].sort(
        (first, second) =>
            new Date(second.expense_date) -
            new Date(first.expense_date)
    );

    if (!sorted.length) {
        transactionTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    No transactions found.
                </td>
            </tr>
        `;

        return;
    }

    transactionTable.innerHTML = sorted
        .map(
            expense => `
                <tr>
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
                                expense.category || "Other"
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
                        ${money(expense.amount)}
                    </td>
                </tr>
            `
        )
        .join("");
}


/* =========================================================
   TRANSACTIONS PAGE
========================================================= */

function getFilteredTransactions() {
    const search =
        transactionsSearch?.value
            .toLowerCase()
            .trim() || "";

    const category =
        categoryFilter?.value || "";

    const sort =
        transactionSort?.value ||
        "date-desc";

    const filtered = allExpenses.filter(
        expense => {
            const matchesSearch =
                String(expense.category || "")
                    .toLowerCase()
                    .includes(search) ||

                String(expense.description || "")
                    .toLowerCase()
                    .includes(search) ||

                String(expense.amount || "")
                    .toLowerCase()
                    .includes(search);

            const matchesCategory =
                !category ||
                expense.category === category;

            return (
                matchesSearch &&
                matchesCategory
            );
        }
    );

    const [field, direction] =
        sort.split("-");

    return filtered.sort(
        (first, second) => {
            const firstValue =
                field === "amount"
                    ? Number(first.amount || 0)
                    : new Date(
                        first.expense_date
                    ).getTime();

            const secondValue =
                field === "amount"
                    ? Number(second.amount || 0)
                    : new Date(
                        second.expense_date
                    ).getTime();

            return direction === "asc"
                ? firstValue - secondValue
                : secondValue - firstValue;
        }
    );
}


function renderAllTransactions() {
    if (!allTransactionsTable) return;

    const expenses =
        getFilteredTransactions();

    if (transactionsResultCount) {
        transactionsResultCount.textContent =
            `${expenses.length} transaction${
                expenses.length === 1 ? "" : "s"
            } found`;
    }

    if (!expenses.length) {
        allTransactionsTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    No transactions match your filters.
                </td>
            </tr>
        `;

        return;
    }

    allTransactionsTable.innerHTML = expenses
        .map(
            expense => `
                <tr>
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
                                expense.category || "Other"
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
                        ${money(expense.amount)}
                    </td>

                    <td>
                        <div class="transaction-actions">
                            <button
                                class="transaction-edit-btn"
                                type="button"
                                data-action="edit"
                                data-expense-id="${expense.id}"
                            >
                                Edit
                            </button>

                            <button
                                class="transaction-delete-btn"
                                type="button"
                                data-action="delete"
                                data-expense-id="${expense.id}"
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `
        )
        .join("");
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showDashboardView() {
    if (dashboardView) {
        dashboardView.hidden = false;
    }

    if (transactionsView) {
        transactionsView.hidden = true;
    }

    dashboardNav?.classList.add("active");
    transactionsNav?.classList.remove("active");
}


function showTransactionsView() {
    if (dashboardView) {
        dashboardView.hidden = true;
    }

    if (transactionsView) {
        transactionsView.hidden = false;
    }

    dashboardNav?.classList.remove("active");
    transactionsNav?.classList.add("active");

    renderAllTransactions();
}


/* =========================================================
   ADD AND EDIT EXPENSE
========================================================= */

function openExpenseModal(expense = null) {
    if (!modal) return;

    editingExpenseId =
        expense ? expense.id : null;

    if (expense) {
        expenseModalEyebrow.textContent =
            "EDIT TRANSACTION";

        expenseModalTitle.textContent =
            "Edit Expense";

        expenseSubmitBtn.textContent =
            "Save Changes";

        expenseAmount.value =
            expense.amount;

        expenseCategory.value =
            expense.category || "";

        expenseDescription.value =
            expense.description || "";

        expenseDate.value =
            String(expense.expense_date)
                .split("T")[0];

    } else {
        expenseModalEyebrow.textContent =
            "NEW TRANSACTION";

        expenseModalTitle.textContent =
            "Add Expense";

        expenseSubmitBtn.textContent =
            "Add Expense";

        expenseForm.reset();

        expenseDate.value = getToday();
    }

    modal.classList.add("show");

    document.body.classList.add("modal-open");

    setTimeout(() => {
        expenseAmount?.focus();
    }, 100);
}


function closeModal() {
    if (!modal) return;

    modal.classList.remove("show");

    document.body.classList.remove("modal-open");

    editingExpenseId = null;
}


async function saveExpense(event) {
    event.preventDefault();

    const amount =
        Number(expenseAmount.value);

    if (!amount || amount <= 0) {
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

    const isEditing =
        editingExpenseId !== null;

    const expense = {
        amount: amount,
        category: expenseCategory.value,
        description:
            expenseDescription.value.trim(),
        expense_date: expenseDate.value
    };

    if (!isEditing) {
        expense.user_id = USER_ID;
    }

    setLoading(
        expenseSubmitBtn,
        true,
        isEditing ? "Saving..." : "Adding..."
    );

    try {
        const response = await fetch(
            isEditing
                ? `${API_BASE}/expenses/${editingExpenseId}`
                : `${API_BASE}/expenses/`,
            {
                method: isEditing ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(expense)
            }
        );

        if (!response.ok) {
            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Could not save expense."
            );
        }

        closeModal();

        showToast(
            isEditing
                ? "Expense updated successfully."
                : "Expense added successfully."
        );

        await loadDashboard();

    } catch (error) {
        console.error(error);

        showToast(
            "Could not save expense.",
            "error"
        );

    } finally {
        setLoading(
            expenseSubmitBtn,
            false
        );
    }
}


async function deleteExpense(expenseId) {
    const expense = allExpenses.find(
        item =>
            Number(item.id) ===
            Number(expenseId)
    );

    const description =
        expense?.description ||
        "this expense";

    const confirmed = window.confirm(
        `Delete "${description}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_BASE}/expenses/${expenseId}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "Could not delete expense."
            );
        }

        showToast(
            "Expense deleted successfully."
        );

        await loadDashboard();

    } catch (error) {
        console.error(error);

        showToast(
            "Could not delete expense.",
            "error"
        );
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

dashboardNav?.addEventListener(
    "click",
    showDashboardView
);

transactionsNav?.addEventListener(
    "click",
    showTransactionsView
);

refreshBtn?.addEventListener(
    "click",
    loadDashboard
);

transactionsRefreshBtn?.addEventListener(
    "click",
    loadDashboard
);

addExpenseBtn?.addEventListener(
    "click",
    () => openExpenseModal()
);

transactionsAddExpenseBtn?.addEventListener(
    "click",
    () => openExpenseModal()
);

closeModalBtn?.addEventListener(
    "click",
    closeModal
);

expenseForm?.addEventListener(
    "submit",
    saveExpense
);

modal?.addEventListener(
    "click",
    event => {
        if (event.target === modal) {
            closeModal();
        }
    }
);

document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Escape" &&
            modal?.classList.contains("show")
        ) {
            closeModal();
        }
    }
);

dashboardSearch?.addEventListener(
    "input",
    event => {
        const search =
            event.target.value
                .toLowerCase()
                .trim();

        const filtered = allExpenses.filter(
            expense =>
                String(expense.category || "")
                    .toLowerCase()
                    .includes(search) ||

                String(expense.description || "")
                    .toLowerCase()
                    .includes(search) ||

                String(expense.amount || "")
                    .toLowerCase()
                    .includes(search)
        );

        renderRecentTransactions(filtered);
    }
);

transactionsSearch?.addEventListener(
    "input",
    renderAllTransactions
);

categoryFilter?.addEventListener(
    "change",
    renderAllTransactions
);

transactionSort?.addEventListener(
    "change",
    renderAllTransactions
);

allTransactionsTable?.addEventListener(
    "click",
    event => {
        const button =
            event.target.closest("button[data-action]");

        if (!button) return;

        const expenseId =
            Number(button.dataset.expenseId);

        const expense = allExpenses.find(
            item =>
                Number(item.id) === expenseId
        );

        if (!expense) {
            showToast(
                "Expense not found.",
                "error"
            );

            return;
        }

        if (button.dataset.action === "edit") {
            openExpenseModal(expense);
        }

        if (button.dataset.action === "delete") {
            deleteExpense(expenseId);
        }
    }
);

themeToggle?.addEventListener(
    "click",
    () => {
        document.body.classList.toggle("dark");

        const isDark =
            document.body.classList.contains("dark");

        themeToggle.innerHTML = isDark
            ? "☀ Light Mode"
            : "☾ Dark Mode";

        localStorage.setItem(
            "finpilot-theme",
            isDark ? "dark" : "light"
        );

        if (expenseChart) {
            const textColor =
                getComputedStyle(document.body)
                    .getPropertyValue("--text")
                    .trim();

            expenseChart.options
                .plugins
                .legend
                .labels
                .color = textColor;

            expenseChart.update();
        }
    }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

if (
    localStorage.getItem("finpilot-theme") ===
    "dark"
) {
    document.body.classList.add("dark");

    if (themeToggle) {
        themeToggle.innerHTML =
            "☀ Light Mode";
    }
}

if (expenseDate) {
    expenseDate.value = getToday();
}

loadDashboard();