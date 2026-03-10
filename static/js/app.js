const { createApp, reactive } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const currentSession = reactive({
    loggedInUser: JSON.parse(localStorage.getItem("hiresphere_user") || "null"),
    get isLoggedIn() {
        return !!this.loggedInUser;
    },
    saveLogin(userData) {
        this.loggedInUser = userData;
        localStorage.setItem("hiresphere_user", JSON.stringify(userData));
    },
    clearLogin() {
        this.loggedInUser = null;
        localStorage.removeItem("hiresphere_user");
    }
});

async function callApi(httpMethod, urlPath, bodyData = null) {
    try {
        const requestConfig = {
            method: httpMethod,
            url: `/api${urlPath}`,
            headers: { "Content-Type": "application/json" },
            withCredentials: true
        };
        if (bodyData) requestConfig.data = bodyData;
        const serverResponse = await axios(requestConfig);
        return { result: serverResponse.data, errorMessage: null };
    } catch (networkError) {
        const errorText = networkError.response?.data?.error || "Something went wrong. Please try again.";
        return { result: null, errorMessage: errorText };
    }
}

/* ================================================================
   LANDING PAGE
================================================================ */
const LandingPage = {
    template: `
        <div>
            <section class="hs-hero">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-7 fade-in">
                            <div class="hs-hero-badge"><i class="bi bi-stars me-1"></i> India's Smartest Campus Recruitment Portal</div>
                            <h1>Find Your Dream <span class="accent">Career</span><br/>Through HireSphere</h1>
                            <p class="lead mb-4">A single platform connecting students, companies, and institutes for seamless campus placements.</p>
                            <div class="d-flex gap-3 flex-wrap">
                                <router-link to="/register" class="btn-hs-primary">Get Started Free <i class="bi bi-arrow-right ms-1"></i></router-link>
                                <router-link to="/login" class="btn-hs-outline">Sign In</router-link>
                            </div>
                        </div>
                        <div class="col-lg-5 d-none d-lg-flex justify-content-center">
                            <div style="position:relative; text-align:center;">
                                <div style="font-size:9rem; filter:drop-shadow(0 20px 40px rgba(0,0,0,0.3));">🎓</div>
                                <div class="position-absolute" style="top:10px; right:-20px; background:rgba(255,255,255,0.95); border-radius:12px; padding:0.75rem 1rem; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
                                    <div class="d-flex align-items-center gap-2">
                                        <div style="background:#10b981; width:8px; height:8px; border-radius:50%;"></div>
                                        <small class="fw-semibold text-dark">New Drive Posted!</small>
                                    </div>
                                    <div style="font-size:0.75rem; color:#6b7280; margin-top:2px;">Google · Software Engineer</div>
                                </div>
                                <div class="position-absolute" style="bottom:20px; left:-20px; background:rgba(255,255,255,0.95); border-radius:12px; padding:0.75rem 1rem; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
                                    <div class="d-flex align-items-center gap-2">
                                        <div style="font-size:1.2rem;">🎉</div>
                                        <div>
                                            <div style="font-size:0.8rem; font-weight:700; color:#1a3c6e;">Selected!</div>
                                            <div style="font-size:0.7rem; color:#6b7280;">Priya S. · ₹18 LPA</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="hs-stats">
                <div class="container">
                    <div class="row text-center">
                        <div class="col-6 col-md-3 hs-stat-item mb-3 mb-md-0"><h3>1,200+</h3><p>Students Placed</p></div>
                        <div class="col-6 col-md-3 hs-stat-item mb-3 mb-md-0"><h3>300+</h3><p>Partner Companies</p></div>
                        <div class="col-6 col-md-3 hs-stat-item"><h3>500+</h3><p>Placement Drives</p></div>
                        <div class="col-6 col-md-3 hs-stat-item"><h3>₹24 LPA</h3><p>Highest Package</p></div>
                    </div>
                </div>
            </section>
            <section class="hs-section">
                <div class="container">
                    <div class="text-center mb-5">
                        <h2 class="hs-section-title">Built for Everyone on Campus</h2>
                        <p class="hs-section-subtitle mt-2">Whether you're a student, a company, or the institute — HireSphere has you covered.</p>
                    </div>
                    <div class="row g-4">
                        <div class="col-md-4">
                            <div class="hs-role-card">
                                <div class="hs-role-icon student"><span>🎓</span></div>
                                <h4 class="fw-bold text-hs-blue">For Students</h4>
                                <p class="text-muted small mb-3">Register, browse drives, and track your placement journey.</p>
                                <ul><li>Browse approved placement drives</li><li>Filter by eligibility</li><li>Apply with one click</li><li>Track application status</li></ul>
                                <div class="mt-4"><router-link to="/register" class="btn btn-sm btn-outline-primary fw-semibold">Register as Student →</router-link></div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="hs-role-card">
                                <div class="hs-role-icon company"><span>🏢</span></div>
                                <h4 class="fw-bold text-hs-blue">For Companies</h4>
                                <p class="text-muted small mb-3">Post drives and hire top campus talent.</p>
                                <ul><li>Register your company profile</li><li>Create placement drives</li><li>View and filter applications</li><li>Shortlist candidates</li></ul>
                                <div class="mt-4"><router-link to="/register" class="btn btn-sm btn-outline-warning fw-semibold">Register as Company →</router-link></div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="hs-role-card">
                                <div class="hs-role-icon admin"><span>🏛️</span></div>
                                <h4 class="fw-bold text-hs-blue">For Institutes</h4>
                                <p class="text-muted small mb-3">Complete oversight of campus recruitment.</p>
                                <ul><li>Approve company registrations</li><li>Manage placement drives</li><li>Monitor all applications</li><li>Generate monthly reports</li></ul>
                                <div class="mt-4"><router-link to="/login" class="btn btn-sm btn-outline-success fw-semibold">Admin Login →</router-link></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section class="hs-section bg-hs-gray">
                <div class="container">
                    <div class="text-center mb-5">
                        <h2 class="hs-section-title">How It Works</h2>
                        <p class="hs-section-subtitle mt-2">Get placed in 4 simple steps</p>
                    </div>
                    <div class="row g-3">
                        <div class="col-6 col-md-3"><div class="hs-step"><div class="hs-step-number">1</div><h5>Register</h5><p>Create your profile in under 2 minutes.</p></div></div>
                        <div class="col-6 col-md-3"><div class="hs-step"><div class="hs-step-number">2</div><h5>Get Approved</h5><p>Admin verifies companies to keep things trusted.</p></div></div>
                        <div class="col-6 col-md-3"><div class="hs-step"><div class="hs-step-number">3</div><h5>Apply</h5><p>Students apply to eligible drives with one click.</p></div></div>
                        <div class="col-6 col-md-3"><div class="hs-step"><div class="hs-step-number">4</div><h5>Get Placed!</h5><p>Companies shortlist and select candidates.</p></div></div>
                    </div>
                </div>
            </section>
        </div>
    `
};

/* ================================================================
   LOGIN PAGE
================================================================ */
const LoginPage = {
    template: `
        <div class="hs-auth-wrapper">
            <div class="container">
                <div class="hs-auth-card fade-in">
                    <div class="text-center mb-4">
                        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔷</div>
                        <h2 class="fw-bold text-hs-blue">Welcome Back</h2>
                        <p class="text-muted" style="font-size:0.9rem;">Sign in to your HireSphere account</p>
                    </div>
                    <div v-if="loginError" class="hs-alert hs-alert-error mb-4">
                        <i class="bi bi-exclamation-circle me-2"></i>{{ loginError }}
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Email Address</label>
                        <input type="email" class="form-control" placeholder="you@example.com" v-model="typedEmail" @keyup.enter="submitLogin" />
                    </div>
                    <div class="mb-4">
                        <label class="form-label">Password</label>
                        <div class="position-relative">
                            <input :type="showingPassword ? 'text' : 'password'" class="form-control" placeholder="Enter your password" v-model="typedPassword" @keyup.enter="submitLogin" />
                            <button type="button" class="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted" style="padding:0 12px; text-decoration:none;" @click="showingPassword = !showingPassword">
                                <i :class="showingPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                            </button>
                        </div>
                    </div>
                    <button class="btn btn-primary w-100 fw-bold py-2" @click="submitLogin" :disabled="waitingForServer" style="border-radius:8px; font-size:1rem;">
                        <span v-if="waitingForServer" class="hs-spinner me-2"></span>
                        <span v-if="!waitingForServer"><i class="bi bi-box-arrow-in-right me-2"></i>Sign In</span>
                        <span v-if="waitingForServer">Signing in...</span>
                    </button>
                    <p class="text-center text-muted mt-4" style="font-size:0.9rem;">
                        Don't have an account? <router-link to="/register" class="fw-semibold text-primary">Register here</router-link>
                    </p>
                    <div class="text-center mt-2" style="font-size:0.8rem; color:#9ca3af;">
                        <i class="bi bi-shield-lock me-1"></i> Admin? Use your institute credentials.
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return { typedEmail: "", typedPassword: "", showingPassword: false, waitingForServer: false, loginError: "" };
    },
    methods: {
        async submitLogin() {
            this.loginError = "";
            if (!this.typedEmail.trim()) { this.loginError = "Please enter your email address."; return; }
            if (!this.typedPassword)     { this.loginError = "Please enter your password.";       return; }
            this.waitingForServer = true;
            const { result, errorMessage } = await callApi("POST", "/auth/login", { email: this.typedEmail.trim(), password: this.typedPassword });
            this.waitingForServer = false;
            if (errorMessage) { this.loginError = errorMessage; return; }
            currentSession.saveLogin(result.user);
            this.$router.push(`/${result.user.role}/dashboard`);
        }
    }
};

/* ================================================================
   REGISTER PAGE
================================================================ */
const RegisterPage = {
    template: `
        <div class="hs-auth-wrapper" style="padding-top:5rem; padding-bottom:3rem;">
            <div class="container">
                <div class="hs-auth-card fade-in">
                    <div class="text-center mb-4">
                        <div style="font-size:2.5rem; margin-bottom:0.5rem;">✨</div>
                        <h2 class="fw-bold text-hs-blue">Create Your Account</h2>
                        <p class="text-muted" style="font-size:0.9rem;">Join HireSphere and start your journey</p>
                    </div>
                    <div v-if="currentStep === 1">
                        <p class="fw-semibold text-center mb-3" style="color:#374151;">I am registering as a...</p>
                        <div class="row g-3 mb-4">
                            <div class="col-6">
                                <div class="hs-role-select" :class="{ selected: pickedRole === 'student' }" @click="pickedRole = 'student'">
                                    <div class="role-icon">🎓</div><h6>Student</h6><p>Looking for placement opportunities</p>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="hs-role-select" :class="{ selected: pickedRole === 'company' }" @click="pickedRole = 'company'">
                                    <div class="role-icon">🏢</div><h6>Company</h6><p>Hiring campus talent</p>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary w-100 fw-bold py-2" @click="currentStep = 2" :disabled="!pickedRole" style="border-radius:8px;">
                            Continue as {{ pickedRole ? (pickedRole === 'student' ? 'Student' : 'Company') : '...' }} <i class="bi bi-arrow-right ms-2"></i>
                        </button>
                    </div>
                    <div v-if="currentStep === 2">
                        <div class="d-flex align-items-center justify-content-between mb-4">
                            <button class="btn btn-sm btn-outline-secondary" @click="currentStep = 1"><i class="bi bi-arrow-left me-1"></i> Back</button>
                            <span class="badge" :class="pickedRole === 'student' ? 'bg-primary' : 'bg-warning text-dark'">
                                {{ pickedRole === 'student' ? '🎓 Student Registration' : '🏢 Company Registration' }}
                            </span>
                        </div>
                        <div v-if="registerError" class="hs-alert hs-alert-error mb-3"><i class="bi bi-exclamation-circle me-2"></i>{{ registerError }}</div>
                        <div class="mb-3"><label class="form-label">Email Address *</label><input type="email" class="form-control" placeholder="you@example.com" v-model="formData.email" /></div>
                        <div class="row g-3 mb-3">
                            <div class="col-6"><label class="form-label">Password *</label><input type="password" class="form-control" placeholder="Min. 6 characters" v-model="formData.password" /></div>
                            <div class="col-6"><label class="form-label">Confirm Password *</label><input type="password" class="form-control" placeholder="Repeat password" v-model="formData.confirmPassword" /></div>
                        </div>
                        <template v-if="pickedRole === 'student'">
                            <hr class="my-3"/><p class="fw-semibold small text-muted mb-3">STUDENT DETAILS</p>
                            <div class="mb-3"><label class="form-label">Full Name *</label><input type="text" class="form-control" placeholder="e.g. Priya Sharma" v-model="formData.fullName" /></div>
                            <div class="row g-3 mb-3">
                                <div class="col-6">
                                    <label class="form-label">Branch</label>
                                    <select class="form-control" v-model="formData.branch">
                                        <option value="">Select branch</option>
                                        <option>Computer Science</option><option>Information Technology</option>
                                        <option>Electronics & Communication</option><option>Electrical Engineering</option>
                                        <option>Mechanical Engineering</option><option>Civil Engineering</option><option>Other</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Current Year</label>
                                    <select class="form-control" v-model="formData.studyYear">
                                        <option value="">Select year</option>
                                        <option value="1">1st Year</option><option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option><option value="4">4th Year</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-6"><label class="form-label">CGPA</label><input type="number" class="form-control" placeholder="e.g. 8.5" step="0.1" min="0" max="10" v-model="formData.cgpa" /></div>
                                <div class="col-6"><label class="form-label">Phone</label><input type="tel" class="form-control" placeholder="10-digit number" v-model="formData.phone" /></div>
                            </div>
                        </template>
                        <template v-if="pickedRole === 'company'">
                            <hr class="my-3"/><p class="fw-semibold small text-muted mb-3">COMPANY DETAILS</p>
                            <div class="mb-3"><label class="form-label">Company Name *</label><input type="text" class="form-control" placeholder="e.g. Infosys Ltd." v-model="formData.companyName" /></div>
                            <div class="row g-3 mb-3">
                                <div class="col-6"><label class="form-label">HR Contact Name</label><input type="text" class="form-control" v-model="formData.hrContact" /></div>
                                <div class="col-6"><label class="form-label">Website</label><input type="url" class="form-control" placeholder="https://company.com" v-model="formData.website" /></div>
                            </div>
                            <div class="mb-3"><label class="form-label">About Your Company</label><textarea class="form-control" rows="3" v-model="formData.about"></textarea></div>
                            <div class="alert alert-info d-flex gap-2 p-3" style="border-radius:10px; font-size:0.85rem;">
                                <i class="bi bi-info-circle-fill mt-1"></i>
                                <div>After registration, your account needs <strong>admin approval</strong> before you can post drives.</div>
                            </div>
                        </template>
                        <button class="btn btn-primary w-100 fw-bold py-2 mt-3" @click="submitRegister" :disabled="waitingForServer" style="border-radius:8px; font-size:1rem;">
                            <span v-if="waitingForServer" class="hs-spinner me-2"></span>
                            <span v-if="!waitingForServer"><i class="bi bi-person-plus me-2"></i>Create Account</span>
                            <span v-if="waitingForServer">Creating account...</span>
                        </button>
                    </div>
                    <p class="text-center text-muted mt-4" style="font-size:0.9rem;">
                        Already have an account? <router-link to="/login" class="fw-semibold text-primary">Sign in here</router-link>
                    </p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            currentStep: 1, pickedRole: "", waitingForServer: false, registerError: "",
            formData: { email: "", password: "", confirmPassword: "", fullName: "", branch: "", studyYear: "", cgpa: "", phone: "", companyName: "", hrContact: "", website: "", about: "" }
        };
    },
    methods: {
        async submitRegister() {
            this.registerError = "";
            if (!this.formData.email.trim())                                        { this.registerError = "Email is required.";                      return; }
            if (this.formData.password.length < 6)                                  { this.registerError = "Password must be at least 6 characters."; return; }
            if (this.formData.password !== this.formData.confirmPassword)           { this.registerError = "Passwords do not match.";                 return; }
            if (this.pickedRole === "student" && !this.formData.fullName.trim())    { this.registerError = "Full name is required.";                   return; }
            if (this.pickedRole === "company" && !this.formData.companyName.trim()) { this.registerError = "Company name is required.";               return; }
            this.waitingForServer = true;
            const dataToSend = { email: this.formData.email.trim(), password: this.formData.password, role: this.pickedRole };
            if (this.pickedRole === "student") {
                dataToSend.full_name = this.formData.fullName.trim();
                dataToSend.branch    = this.formData.branch;
                dataToSend.year      = this.formData.studyYear ? parseInt(this.formData.studyYear) : null;
                dataToSend.cgpa      = this.formData.cgpa      ? parseFloat(this.formData.cgpa)    : null;
                dataToSend.phone     = this.formData.phone.trim();
            } else {
                dataToSend.company_name = this.formData.companyName.trim();
                dataToSend.hr_contact   = this.formData.hrContact.trim();
                dataToSend.website      = this.formData.website.trim();
                dataToSend.description  = this.formData.about.trim();
            }
            const { result, errorMessage } = await callApi("POST", "/auth/register", dataToSend);
            this.waitingForServer = false;
            if (errorMessage) { this.registerError = errorMessage; return; }
            currentSession.saveLogin(result.user);
            this.$router.push(`/${result.user.role}/dashboard`);
        }
    }
};

/* ================================================================
   ADMIN DASHBOARD
================================================================ */
const AdminDashboard = {
    template: `
        <div class="hs-dashboard">
            <div class="container-fluid px-4 py-4">
                <div class="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
                    <div>
                        <h3 class="fw-bold text-hs-blue mb-0">Welcome back, Admin 👋</h3>
                        <p class="text-muted mb-0" style="font-size:0.9rem;">Here's what's happening at HireSphere today.</p>
                    </div>
                    <div class="admin-search-bar">
                        <i class="bi bi-search search-icon"></i>
                        <input type="text" class="form-control" placeholder="Search students, companies or drives..." v-model="searchText" />
                    </div>
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon" style="background:#eff6ff; color:#2563eb;">🎓</div><div><div class="stat-number">{{ statsData.total_students || 0 }}</div><div class="stat-label">Total Students</div></div></div></div>
                    <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon" style="background:#fff7ed; color:#ea580c;">🏢</div><div><div class="stat-number">{{ statsData.total_companies || 0 }}</div><div class="stat-label">Approved Companies</div></div></div></div>
                    <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon" style="background:#f0fdf4; color:#16a34a;">📋</div><div><div class="stat-number">{{ statsData.total_drives || 0 }}</div><div class="stat-label">Ongoing Drives</div></div></div></div>
                    <div class="col-6 col-md-3"><div class="admin-stat-card"><div class="stat-icon" style="background:#fef9c3; color:#ca8a04;">⏳</div><div><div class="stat-number">{{ statsData.pending_approvals || 0 }}</div><div class="stat-label">Pending Approvals</div></div></div></div>
                </div>
                <div v-if="flashMessage" class="alert mb-4 d-flex align-items-center gap-2 fade-in" :class="flashType === 'success' ? 'alert-success' : 'alert-danger'" style="border-radius:10px;">
                    <i :class="flashType === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                    {{ flashMessage }}
                </div>
                <div class="admin-table-card mb-4">
                    <div class="admin-table-header">
                        <div><h5 class="mb-0">🏢 Registered Companies</h5><small class="text-muted">All approved companies</small></div>
                        <span class="badge bg-primary rounded-pill">{{ visibleCompanies.length }}</span>
                    </div>
                    <div v-if="loadingCompanies" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading...</div>
                    <div v-else-if="visibleCompanies.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">🏢</div><p class="mt-2 text-muted">No approved companies yet.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table hs-table">
                            <thead><tr><th>#</th><th>Company Name</th><th>Email</th><th>HR Contact</th><th>Website</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(company, index) in visibleCompanies" :key="company.id" :class="{ 'table-row-blacklisted': company.is_blacklisted }">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ company.company_name }}</td>
                                    <td>{{ company.email }}</td>
                                    <td>{{ company.hr_contact || '—' }}</td>
                                    <td><a v-if="company.website" :href="company.website" target="_blank" class="text-primary text-decoration-none" style="font-size:0.85rem;"><i class="bi bi-box-arrow-up-right me-1"></i>Visit</a><span v-else class="text-muted">—</span></td>
                                    <td><span v-if="company.is_blacklisted" class="hs-badge hs-badge-danger">Blacklisted</span><span v-else class="hs-badge hs-badge-success">Active</span></td>
                                    <td>
                                        <button v-if="!company.is_blacklisted" class="btn btn-sm btn-outline-danger fw-semibold" @click="doBlacklistCompany(company)"><i class="bi bi-slash-circle me-1"></i>Blacklist</button>
                                        <button v-else class="btn btn-sm btn-outline-success fw-semibold" @click="doUnblacklistCompany(company)"><i class="bi bi-check-circle me-1"></i>Reinstate</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="admin-table-card mb-4">
                    <div class="admin-table-header">
                        <div><h5 class="mb-0">🎓 Registered Students</h5><small class="text-muted">All enrolled students</small></div>
                        <span class="badge bg-primary rounded-pill">{{ visibleStudents.length }}</span>
                    </div>
                    <div v-if="loadingStudents" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading...</div>
                    <div v-else-if="visibleStudents.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">🎓</div><p class="mt-2 text-muted">No students registered yet.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table hs-table">
                            <thead><tr><th>#</th><th>Full Name</th><th>Email</th><th>Branch</th><th>Year</th><th>CGPA</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(student, index) in visibleStudents" :key="student.id" :class="{ 'table-row-blacklisted': student.is_blacklisted }">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ student.full_name }}</td>
                                    <td>{{ student.email }}</td>
                                    <td>{{ student.branch || '—' }}</td>
                                    <td>{{ student.year ? student.year + ' yr' : '—' }}</td>
                                    <td>{{ student.cgpa || '—' }}</td>
                                    <td><span v-if="student.is_blacklisted" class="hs-badge hs-badge-danger">Blacklisted</span><span v-else class="hs-badge hs-badge-success">Active</span></td>
                                    <td>
                                        <button v-if="!student.is_blacklisted" class="btn btn-sm btn-outline-danger fw-semibold" @click="doBlacklistStudent(student)"><i class="bi bi-slash-circle me-1"></i>Blacklist</button>
                                        <button v-else class="btn btn-sm btn-outline-success fw-semibold" @click="doUnblacklistStudent(student)"><i class="bi bi-check-circle me-1"></i>Reinstate</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="admin-table-card mb-4">
                    <div class="admin-table-header">
                        <div><h5 class="mb-0">⏳ Company Applications</h5><small class="text-muted">Awaiting your approval</small></div>
                        <span class="badge bg-warning text-dark rounded-pill">{{ pendingCompanies.length }}</span>
                    </div>
                    <div v-if="loadingPending" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading...</div>
                    <div v-else-if="pendingCompanies.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">✅</div><p class="mt-2 text-muted">No pending applications!</p></div>
                    <div v-else class="table-responsive">
                        <table class="table hs-table">
                            <thead><tr><th>#</th><th>Company Name</th><th>Email</th><th>HR Contact</th><th>Website</th><th>About</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(company, index) in pendingCompanies" :key="company.id">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ company.company_name }}</td>
                                    <td>{{ company.email }}</td>
                                    <td>{{ company.hr_contact || '—' }}</td>
                                    <td><a v-if="company.website" :href="company.website" target="_blank" class="text-primary text-decoration-none" style="font-size:0.85rem;"><i class="bi bi-box-arrow-up-right me-1"></i>Visit</a><span v-else>—</span></td>
                                    <td style="max-width:200px;"><span style="font-size:0.8rem; color:#6b7280;">{{ company.description ? company.description.substring(0,60)+'...' : '—' }}</span></td>
                                    <td>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-sm btn-success fw-semibold" @click="doApproveCompany(company)"><i class="bi bi-check-lg me-1"></i>Approve</button>
                                            <button class="btn btn-sm btn-outline-danger fw-semibold" @click="doRejectCompany(company)"><i class="bi bi-x-lg me-1"></i>Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="admin-table-card mb-4">
                    <div class="admin-table-header">
                        <div><h5 class="mb-0">📋 Ongoing Drives</h5><small class="text-muted">Currently active placement drives</small></div>
                        <!-- PATCH 2: use filteredDrives.length -->
                        <span class="badge bg-success rounded-pill">{{ filteredDrives.length }}</span>
                    </div>
                    <div v-if="loadingDrives" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading...</div>
                    <div v-else-if="filteredDrives.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">📋</div><p class="mt-2 text-muted">No ongoing drives.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table hs-table">
                            <thead><tr><th>#</th><th>Drive Name</th><th>Company</th><th>Job Title</th><th>Deadline</th><th>Actions</th></tr></thead>
                            <tbody>
                                <!-- PATCH 2: iterate filteredDrives -->
                                <tr v-for="(drive, index) in filteredDrives" :key="drive.id">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ drive.drive_name }}</td>
                                    <td>{{ drive.company_name }}</td>
                                    <td>{{ drive.job_title }}</td>
                                    <td style="font-size:0.85rem;">{{ drive.application_deadline || '—' }}</td>
                                    <td>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-sm btn-outline-primary fw-semibold" @click="openDriveDetailsModal(drive)"><i class="bi bi-eye me-1"></i>View Details</button>
                                            <button class="btn btn-sm btn-success fw-semibold" @click="doMarkDriveComplete(drive)"><i class="bi bi-check2-all me-1"></i>Mark Complete</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="admin-table-card mb-4">
                    <div class="admin-table-header">
                        <div><h5 class="mb-0">📝 Student Applications</h5><small class="text-muted">All applications submitted</small></div>
                        <span class="badge bg-info rounded-pill">{{ allApplications.length }}</span>
                    </div>
                    <div v-if="loadingApplications" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading...</div>
                    <div v-else-if="allApplications.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">📝</div><p class="mt-2 text-muted">No applications yet.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table hs-table">
                            <thead><tr><th>#</th><th>Student Name</th><th>Drive Applied For</th><th>Company</th><th>Applied On</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(application, index) in allApplications" :key="application.id">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ application.student_name }}</td>
                                    <td>{{ application.drive_name }}</td>
                                    <td>{{ application.company_name }}</td>
                                    <td style="font-size:0.85rem;">{{ formatDate(application.applied_on) }}</td>
                                    <td><span class="hs-badge" :class="getApplicationBadgeClass(application.status)">{{ application.status }}</span></td>
                                    <td><button class="btn btn-sm btn-outline-primary fw-semibold" @click="openApplicationModal(application)"><i class="bi bi-eye me-1"></i>View</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="hs-modal-overlay" v-if="showDriveModal" @click.self="showDriveModal = false">
                <div class="hs-modal-box fade-in">
                    <button class="hs-modal-close" @click="showDriveModal = false"><i class="bi bi-x-lg"></i></button>
                    <div class="d-flex justify-content-between align-items-start gap-3">
                        <div style="flex:1;">
                            <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Drive Details</p>
                            <h4 class="fw-bold text-hs-blue mb-4">{{ selectedDrive.drive_name }}</h4>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-briefcase me-2 text-hs-orange"></i>Job Title</span><span class="detail-value">{{ selectedDrive.job_title }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-file-text me-2 text-hs-orange"></i>Job Description</span><span class="detail-value" style="white-space:pre-wrap;">{{ selectedDrive.job_description || 'Not specified' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-calendar-event me-2 text-hs-orange"></i>Drive Date</span><span class="detail-value">{{ selectedDrive.drive_date || 'Not specified' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-currency-rupee me-2 text-hs-orange"></i>Salary / Package</span><span class="detail-value">{{ selectedDrive.salary || 'Not disclosed' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-geo-alt me-2 text-hs-orange"></i>Location</span><span class="detail-value">{{ selectedDrive.location || 'Not specified' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-calendar-x me-2 text-hs-orange"></i>Application Deadline</span><span class="detail-value">{{ selectedDrive.application_deadline || 'Not specified' }}</span></div>
                        </div>
                        <div class="company-name-badge">{{ selectedDrive.company_name }}</div>
                    </div>
                </div>
            </div>
            <div class="hs-modal-overlay" v-if="showApplicationModal" @click.self="showApplicationModal = false">
                <div class="hs-modal-box fade-in" style="max-width:480px;">
                    <button class="hs-modal-close" @click="showApplicationModal = false"><i class="bi bi-x-lg"></i></button>
                    <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Student Application</p>
                    <h4 class="fw-bold text-hs-blue mb-4">{{ selectedApplication.student_name }}</h4>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-person me-2 text-hs-orange"></i>Student Name</span><span class="detail-value fw-semibold">{{ selectedApplication.student_name }}</span></div>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-building me-2 text-hs-orange"></i>Department</span><span class="detail-value">{{ selectedApplication.student_branch || '—' }}</span></div>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-calendar-check me-2 text-hs-orange"></i>Drive</span><span class="detail-value">{{ selectedApplication.drive_name }}</span></div>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-briefcase me-2 text-hs-orange"></i>Job Title</span><span class="detail-value">{{ selectedApplication.job_title }}</span></div>
                    <div class="mt-4 pt-3 border-top">
                        <a v-if="selectedApplication.student_id" :href="'/api/admin/student-resume/' + selectedApplication.student_id" target="_blank" class="btn btn-primary fw-semibold w-100" style="border-radius:8px;">
                            <i class="bi bi-file-earmark-pdf me-2"></i>View Resume
                        </a>
                        <p class="text-muted text-center mt-2" style="font-size:0.8rem;">Opens in a new tab</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            searchText: "", allRegisteredCompanies: [], allRegisteredStudents: [], pendingCompanies: [], ongoingDrives: [], allApplications: [], statsData: {},
            loadingCompanies: true, loadingStudents: true, loadingPending: true, loadingDrives: true, loadingApplications: true,
            flashMessage: "", flashType: "success",
            showDriveModal: false, selectedDrive: {},
            showApplicationModal: false, selectedApplication: {}
        };
    },
    computed: {
        visibleCompanies() {
            if (!this.searchText.trim()) return this.allRegisteredCompanies;
            const query = this.searchText.toLowerCase();
            return this.allRegisteredCompanies.filter(c => c.company_name.toLowerCase().includes(query) || (c.email || "").toLowerCase().includes(query));
        },
        visibleStudents() {
            if (!this.searchText.trim()) return this.allRegisteredStudents;
            const query = this.searchText.toLowerCase();
            return this.allRegisteredStudents.filter(s => s.full_name.toLowerCase().includes(query) || (s.email || "").toLowerCase().includes(query) || (s.branch || "").toLowerCase().includes(query));
        },
        // PATCH 1: search also filters the drives table
        filteredDrives() {
            if (!this.searchText.trim()) return this.ongoingDrives;
            const query = this.searchText.toLowerCase();
            return this.ongoingDrives.filter(d =>
                d.drive_name.toLowerCase().includes(query)           ||
                d.job_title.toLowerCase().includes(query)            ||
                (d.company_name || "").toLowerCase().includes(query) ||
                (d.location     || "").toLowerCase().includes(query)
            );
        }
    },
    async mounted() {
        await Promise.all([this.fetchStats(), this.fetchCompanies(), this.fetchStudents(), this.fetchPendingCompanies(), this.fetchOngoingDrives(), this.fetchApplications()]);
    },
    methods: {
        async fetchStats() {
            try {
                const { result } = await callApi("GET", "/admin/stats");
                if (result) this.statsData = result;
            } catch (e) { console.error("fetchStats error", e); }
        },
        async fetchCompanies() {
            this.loadingCompanies = true;
            try {
                const { result, errorMessage } = await callApi("GET", "/admin/companies");
                if (result)       this.allRegisteredCompanies = result.companies || [];
                if (errorMessage) this.showFlash(errorMessage, "danger");
            } catch (e) { console.error("fetchCompanies error", e); }
            finally { this.loadingCompanies = false; }
        },
        async fetchStudents() {
            this.loadingStudents = true;
            try {
                const { result, errorMessage } = await callApi("GET", "/admin/students");
                if (result)       this.allRegisteredStudents = result.students || [];
                if (errorMessage) this.showFlash(errorMessage, "danger");
            } catch (e) { console.error("fetchStudents error", e); }
            finally { this.loadingStudents = false; }
        },
        async fetchPendingCompanies() {
            this.loadingPending = true;
            try {
                const { result, errorMessage } = await callApi("GET", "/admin/pending-companies");
                if (result)       this.pendingCompanies = result.companies || [];
                if (errorMessage) this.showFlash(errorMessage, "danger");
            } catch (e) { console.error("fetchPendingCompanies error", e); }
            finally { this.loadingPending = false; }
        },
        async fetchOngoingDrives() {
            this.loadingDrives = true;
            try {
                const { result, errorMessage } = await callApi("GET", "/admin/ongoing-drives");
                if (result)       this.ongoingDrives = result.drives || [];
                if (errorMessage) this.showFlash(errorMessage, "danger");
            } catch (e) { console.error("fetchOngoingDrives error", e); }
            finally { this.loadingDrives = false; }
        },
        async fetchApplications() {
            this.loadingApplications = true;
            try {
                const { result, errorMessage } = await callApi("GET", "/admin/applications");
                if (result)       this.allApplications = result.applications || [];
                if (errorMessage) this.showFlash(errorMessage, "danger");
            } catch (e) { console.error("fetchApplications error", e); }
            finally { this.loadingApplications = false; }
        },
        async doApproveCompany(c)     { const { result, errorMessage } = await callApi("POST", `/admin/approve-company/${c.id}`);    if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchPendingCompanies(); await this.fetchCompanies(); await this.fetchStats(); },
        async doRejectCompany(c)      { const { result, errorMessage } = await callApi("POST", `/admin/reject-company/${c.id}`);     if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchPendingCompanies(); },
        async doBlacklistCompany(c)   { const { result, errorMessage } = await callApi("POST", `/admin/blacklist-company/${c.id}`);  if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchCompanies(); await this.fetchOngoingDrives(); },
        async doUnblacklistCompany(c) { const { result, errorMessage } = await callApi("POST", `/admin/unblacklist-company/${c.id}`);if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchCompanies(); },
        async doBlacklistStudent(s)   { const { result, errorMessage } = await callApi("POST", `/admin/blacklist-student/${s.id}`);  if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchStudents(); },
        async doUnblacklistStudent(s) { const { result, errorMessage } = await callApi("POST", `/admin/unblacklist-student/${s.id}`);if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchStudents(); },
        async doMarkDriveComplete(d)  { const { result, errorMessage } = await callApi("POST", `/admin/mark-drive-complete/${d.id}`); if (errorMessage) { this.showFlash(errorMessage, "danger"); return; } this.showFlash(result.message, "success"); await this.fetchOngoingDrives(); await this.fetchStats(); },
        openDriveDetailsModal(drive)  { this.selectedDrive = drive; this.showDriveModal = true; },
        openApplicationModal(app)     { this.selectedApplication = app; this.showApplicationModal = true; },
        showFlash(message, type = "success") { this.flashMessage = message; this.flashType = type; setTimeout(() => { this.flashMessage = ""; }, 4000); },
        formatDate(isoString) { if (!isoString) return "—"; return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); },
        getApplicationBadgeClass(status) { return ({ applied: "hs-badge-info", shortlisted: "hs-badge-warning", selected: "hs-badge-success", rejected: "hs-badge-danger" })[status] || "hs-badge-info"; }
    }
};

/* ================================================================
   COMPANY DASHBOARD
================================================================ */
const CompanyDashboard = {
    template: `
        <div class="hs-dashboard">
            <div class="container-fluid px-4 py-4">
                <div class="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
                    <div>
                        <h3 class="fw-bold text-hs-blue mb-0">Welcome, {{ companyName }}! 👋</h3>
                        <p class="text-muted mb-0" style="font-size:0.9rem;">Manage your placement drives and review student applications.</p>
                    </div>
                    <div v-if="approvalStatus === 'pending'" class="alert alert-warning mb-0 py-2 px-3" style="border-radius:10px; font-size:0.88rem;">
                        <i class="bi bi-clock-history me-2"></i> Your company is <strong>pending admin approval</strong>.
                    </div>
                    <div v-else-if="approvalStatus === 'rejected'" class="alert alert-danger mb-0 py-2 px-3" style="border-radius:10px; font-size:0.88rem;">
                        <i class="bi bi-x-circle me-2"></i> Your registration was <strong>rejected</strong>. Contact admin.
                    </div>
                </div>
                <div v-if="flashMessage" class="alert mb-4 d-flex align-items-center gap-2 fade-in"
                     :class="flashType === 'success' ? 'alert-success' : 'alert-danger'"
                     style="border-radius:10px;">
                    <i :class="flashType === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                    {{ flashMessage }}
                </div>
                <div v-if="approvalStatus !== 'approved'" class="admin-table-card">
                    <div class="table-empty-state py-5">
                        <div style="font-size:3rem;">🔒</div>
                        <p class="mt-2 text-muted">Your dashboard will be accessible once the admin approves your company.</p>
                    </div>
                </div>
                <template v-if="approvalStatus === 'approved'">
                    <div class="admin-table-card mb-4">
                        <div class="admin-table-header">
                            <div><h5 class="mb-0">📋 Upcoming Drives</h5><small class="text-muted">Placement drives created by your company</small></div>
                            <button class="btn btn-primary fw-semibold" style="border-radius:8px;" @click="openCreateDriveModal"><i class="bi bi-plus-lg me-2"></i>Create Drive</button>
                        </div>
                        <div v-if="loadingDrives" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading your drives...</div>
                        <div v-else-if="upcomingDrives.length === 0" class="table-empty-state">
                            <div style="font-size:2.5rem;">📋</div>
                            <p class="mt-2 text-muted">You haven't created any drives yet.</p>
                            <button class="btn btn-sm btn-primary mt-2 fw-semibold" @click="openCreateDriveModal"><i class="bi bi-plus-lg me-1"></i>Create your first drive</button>
                        </div>
                        <div v-else class="table-responsive">
                            <table class="table hs-table">
                                <thead><tr><th>#</th><th>Drive Name</th><th>Job Title</th><th>Deadline</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    <tr v-for="(drive, index) in upcomingDrives" :key="drive.id">
                                        <td class="text-muted">{{ index + 1 }}</td>
                                        <td class="fw-semibold">{{ drive.drive_name }}</td>
                                        <td>{{ drive.job_title }}</td>
                                        <td style="font-size:0.85rem;">{{ drive.application_deadline || '—' }}</td>
                                        <td><span class="hs-badge" :class="getDriveBadgeClass(drive.status)">{{ drive.status }}</span></td>
                                        <td>
                                            <div class="d-flex gap-2">
                                                <button class="btn btn-sm btn-outline-primary fw-semibold" @click="openViewDriveModal(drive)"><i class="bi bi-eye me-1"></i>View Details</button>
                                                <button v-if="drive.status !== 'completed' && drive.status !== 'cancelled'" class="btn btn-sm btn-success fw-semibold" @click="doMarkMyDriveComplete(drive)"><i class="bi bi-check2-all me-1"></i>Mark as Complete</button>
                                                <button v-if="drive.status !== 'completed' && drive.status !== 'cancelled'" class="btn btn-sm btn-outline-danger fw-semibold" @click="doCancelMyDrive(drive)"><i class="bi bi-x-circle me-1"></i>Cancel Drive</button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="admin-table-card mb-4">
                        <div class="admin-table-header">
                            <div><h5 class="mb-0">✅ Closed Drives</h5><small class="text-muted">Placement drives that have been completed or cancelled</small></div>
                            <span class="badge bg-secondary rounded-pill">{{ closedDrives.length }}</span>
                        </div>
                        <div v-if="loadingDrives" class="table-loading-state"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading...</div>
                        <div v-else-if="closedDrives.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">🗂️</div><p class="mt-2 text-muted">No closed drives yet.</p></div>
                        <div v-else class="table-responsive">
                            <table class="table hs-table">
                                <thead><tr><th>#</th><th>Drive Name</th><th>Job Title</th><th>Deadline</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    <tr v-for="(drive, index) in closedDrives" :key="drive.id">
                                        <td class="text-muted">{{ index + 1 }}</td>
                                        <td class="fw-semibold">{{ drive.drive_name }}</td>
                                        <td>{{ drive.job_title }}</td>
                                        <td style="font-size:0.85rem;">{{ drive.application_deadline || '—' }}</td>
                                        <td><span class="hs-badge" :class="getDriveBadgeClass(drive.status)">{{ drive.status }}</span></td>
                                        <td><button class="btn btn-sm btn-outline-secondary fw-semibold" @click="openViewDriveModal(drive)"><i class="bi bi-eye me-1"></i>View Details</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </template>
            </div>
            <!-- View Drive + Applications Modal -->
            <div class="hs-modal-overlay" v-if="showViewDriveModal" @click.self="closeViewDriveModal">
                <div class="hs-modal-box fade-in" style="max-width: 820px;">
                    <button class="hs-modal-close" @click="closeViewDriveModal"><i class="bi bi-x-lg"></i></button>
                    <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Update Applications for the Drive</p>
                    <h4 class="fw-bold text-hs-blue mb-1">{{ selectedDrive.drive_name }}</h4>
                    <p class="text-muted mb-4" style="font-size:0.9rem;"><strong>Job Description:</strong> {{ selectedDrive.job_description || 'No description provided.' }}</p>
                    <h6 class="fw-bold mb-3" style="color:#374151;"><i class="bi bi-people me-2 text-hs-orange"></i>Received Applications <span class="badge bg-secondary ms-2" style="font-size:0.75rem;">{{ driveApplications.length }}</span></h6>
                    <div v-if="loadingDriveApplications" class="table-loading-state py-3"><div class="spinner-border text-primary spinner-border-sm me-2"></div> Loading applications...</div>
                    <div v-else-if="driveApplications.length === 0" class="table-empty-state py-3"><div style="font-size:2rem;">📭</div><p class="mt-2 text-muted" style="font-size:0.9rem;">No students have applied to this drive yet.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table hs-table">
                            <thead><tr><th>#</th><th>Student Name</th><th>Department</th><th>CGPA</th><th>Applied On</th><th>Current Status</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(application, index) in driveApplications" :key="application.id">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ application.student_name }}</td>
                                    <td>{{ application.student_branch || '—' }}</td>
                                    <td>{{ application.student_cgpa || '—' }}</td>
                                    <td style="font-size:0.85rem;">{{ formatDate(application.applied_on) }}</td>
                                    <td><span class="hs-badge" :class="getApplicationBadgeClass(application.status)">{{ application.status }}</span></td>
                                    <td><button class="btn btn-sm btn-outline-primary fw-semibold" @click="openReviewApplicationModal(application)"><i class="bi bi-person-check me-1"></i>Review Application</button></td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="d-flex justify-content-end p-3 border-top">
                            <button class="btn btn-primary fw-semibold px-4" style="border-radius:8px;" @click="saveAllStatuses" :disabled="savingStatuses">
                                <span v-if="savingStatuses" class="hs-spinner me-2"></span>
                                <span v-if="!savingStatuses"><i class="bi bi-floppy me-2"></i>Save All Statuses</span>
                                <span v-if="savingStatuses">Saving...</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Review Individual Application Modal -->
            <div class="hs-modal-overlay" v-if="showReviewModal" @click.self="showReviewModal = false">
                <div class="hs-modal-box fade-in" style="max-width:500px;">
                    <button class="hs-modal-close" @click="showReviewModal = false"><i class="bi bi-x-lg"></i></button>
                    <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Student Application</p>
                    <h4 class="fw-bold text-hs-blue mb-4">{{ reviewingApplication.student_name }}</h4>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-person me-2 text-hs-orange"></i>Student Name</span><span class="detail-value fw-semibold">{{ reviewingApplication.student_name }}</span></div>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-building me-2 text-hs-orange"></i>Department</span><span class="detail-value">{{ reviewingApplication.student_branch || '—' }}</span></div>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-calendar-check me-2 text-hs-orange"></i>Drive</span><span class="detail-value">{{ reviewingApplication.drive_name }}</span></div>
                    <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-briefcase me-2 text-hs-orange"></i>Job Title</span><span class="detail-value">{{ reviewingApplication.job_title }}</span></div>
                    <div class="mt-4 pt-3 border-top">
                        <div class="d-flex gap-3 align-items-center flex-wrap">
                            <a v-if="reviewingApplication.student_id" :href="'/api/company/student-resume/' + reviewingApplication.student_id" target="_blank" class="btn btn-primary fw-semibold flex-grow-1" style="border-radius:8px;"><i class="bi bi-file-earmark-pdf me-2"></i>View Resume</a>
                            <select class="form-select fw-semibold" style="border-radius:8px; border:1.5px solid #e2e8f0; max-width:180px;" v-model="reviewingApplication.status" @change="updateStatusLocally(reviewingApplication)">
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlist</option>
                                <option value="selected">Hire</option>
                                <option value="rejected">Reject</option>
                            </select>
                        </div>
                        <p class="text-muted mt-2" style="font-size:0.8rem;">Select a status, then click <strong>Save All Statuses</strong> in the applications table to confirm.</p>
                    </div>
                </div>
            </div>
            <!-- Create Drive Modal -->
            <div class="hs-modal-overlay" v-if="showCreateDriveModal" @click.self="showCreateDriveModal = false">
                <div class="hs-modal-box fade-in" style="max-width:580px;">
                    <button class="hs-modal-close" @click="showCreateDriveModal = false"><i class="bi bi-x-lg"></i></button>
                    <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">New Placement Drive</p>
                    <h4 class="fw-bold text-hs-blue mb-4">Create A Drive</h4>
                    <div v-if="createDriveError" class="hs-alert hs-alert-error mb-3"><i class="bi bi-exclamation-circle me-2"></i>{{ createDriveError }}</div>
                    <div class="mb-3"><label class="form-label">Drive Name *</label><input type="text" class="form-control" placeholder="e.g. Campus Hiring 2025" v-model="newDriveForm.drive_name" /></div>
                    <div class="mb-3"><label class="form-label">Job Title *</label><input type="text" class="form-control" placeholder="e.g. Software Engineer" v-model="newDriveForm.job_title" /></div>
                    <div class="mb-3"><label class="form-label">Job Description</label><textarea class="form-control" rows="3" placeholder="Describe the role, responsibilities, tech stack..." v-model="newDriveForm.job_description"></textarea></div>
                    <div class="mb-3"><label class="form-label">Eligibility Criteria</label><input type="text" class="form-control" placeholder="e.g. CS/IT students, 3rd year and above, CGPA ≥ 7.0" v-model="newDriveForm.eligible_branches" /><small class="text-muted">List branches, minimum CGPA, year of study, etc.</small></div>
                    <div class="row g-3 mb-3">
                        <div class="col-6"><label class="form-label">Drive Date</label><input type="date" class="form-control" v-model="newDriveForm.drive_date" /></div>
                        <div class="col-6"><label class="form-label">Application Deadline</label><input type="date" class="form-control" v-model="newDriveForm.application_deadline" /></div>
                    </div>
                    <div class="row g-3 mb-4">
                        <div class="col-6"><label class="form-label">Salary / Package</label><input type="text" class="form-control" placeholder="e.g. ₹8 LPA" v-model="newDriveForm.salary" /></div>
                        <div class="col-6"><label class="form-label">Location</label><input type="text" class="form-control" placeholder="e.g. Bangalore / Remote" v-model="newDriveForm.location" /></div>
                    </div>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-secondary fw-semibold me-2" @click="showCreateDriveModal = false">Cancel</button>
                        <button class="btn btn-primary fw-semibold px-4" style="border-radius:8px;" @click="submitCreateDrive" :disabled="savingDrive">
                            <span v-if="savingDrive" class="hs-spinner me-2"></span>
                            <span v-if="!savingDrive"><i class="bi bi-floppy me-2"></i>Save</span>
                            <span v-if="savingDrive">Creating...</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            myDrives: [], loadingDrives: true, flashMessage: "", flashType: "success",
            showViewDriveModal: false, selectedDrive: {}, driveApplications: [], loadingDriveApplications: false, savingStatuses: false,
            showReviewModal: false, reviewingApplication: {},
            showCreateDriveModal: false, savingDrive: false, createDriveError: "",
            newDriveForm: { drive_name: "", job_title: "", job_description: "", eligible_branches: "", drive_date: "", application_deadline: "", salary: "", location: "" }
        };
    },
    computed: {
        companyName()    { return currentSession.loggedInUser?.profile?.company_name || "Company"; },
        approvalStatus() { return currentSession.loggedInUser?.profile?.approval_status || "pending"; },
        upcomingDrives() { return this.myDrives.filter(d => d.status !== "completed" && d.status !== "cancelled"); },
        closedDrives()   { return this.myDrives.filter(d => d.status === "completed" || d.status === "cancelled"); }
    },
    async mounted() { if (this.approvalStatus === "approved") { await this.fetchMyDrives(); } },
    methods: {
        async fetchMyDrives() {
            this.loadingDrives = true;
            const { result, errorMessage } = await callApi("GET", "/company/my-drives");
            if (result) this.myDrives = result.drives;
            if (errorMessage) this.showFlash(errorMessage, "danger");
            this.loadingDrives = false;
        },
        async openViewDriveModal(drive) {
            this.selectedDrive = drive; this.driveApplications = []; this.showViewDriveModal = true; this.loadingDriveApplications = true;
            const { result, errorMessage } = await callApi("GET", `/company/drive/${drive.id}/applications`);
            if (result) this.driveApplications = result.applications;
            if (errorMessage) this.showFlash(errorMessage, "danger");
            this.loadingDriveApplications = false;
        },
        closeViewDriveModal() { this.showViewDriveModal = false; this.driveApplications = []; this.selectedDrive = {}; },
        openReviewApplicationModal(application) { this.reviewingApplication = { ...application }; this.showReviewModal = true; },
        updateStatusLocally(updatedApplication) {
            const matchingIndex = this.driveApplications.findIndex(a => a.id === updatedApplication.id);
            if (matchingIndex !== -1) this.driveApplications[matchingIndex].status = updatedApplication.status;
        },
        async saveAllStatuses() {
            this.savingStatuses = true;
            const updates = this.driveApplications.map(a => ({ application_id: a.id, status: a.status }));
            const { result, errorMessage } = await callApi("POST", "/company/bulk-update-statuses", { updates });
            this.savingStatuses = false;
            if (errorMessage) { this.showFlash(errorMessage, "danger"); return; }
            this.showFlash(result.message, "success");
            await this.openViewDriveModal(this.selectedDrive);
        },
        async doMarkMyDriveComplete(drive) {
            const { result, errorMessage } = await callApi("POST", `/company/drive/${drive.id}/mark-complete`);
            if (errorMessage) { this.showFlash(errorMessage, "danger"); return; }
            this.showFlash(result.message, "success"); await this.fetchMyDrives();
        },
        async doCancelMyDrive(drive) {
            const { result, errorMessage } = await callApi("POST", `/company/drive/${drive.id}/cancel`);
            if (errorMessage) { this.showFlash(errorMessage, "danger"); return; }
            this.showFlash(result.message, "success"); await this.fetchMyDrives();
        },
        openCreateDriveModal() {
            this.createDriveError = "";
            this.newDriveForm = { drive_name: "", job_title: "", job_description: "", eligible_branches: "", drive_date: "", application_deadline: "", salary: "", location: "" };
            this.showCreateDriveModal = true;
        },
        async submitCreateDrive() {
            this.createDriveError = "";
            if (!this.newDriveForm.drive_name.trim()) { this.createDriveError = "Drive name is required."; return; }
            if (!this.newDriveForm.job_title.trim())  { this.createDriveError = "Job title is required.";  return; }
            this.savingDrive = true;
            const { result, errorMessage } = await callApi("POST", "/company/create-drive", this.newDriveForm);
            this.savingDrive = false;
            if (errorMessage) { this.createDriveError = errorMessage; return; }
            this.showCreateDriveModal = false; this.showFlash(result.message, "success"); await this.fetchMyDrives();
        },
        showFlash(message, type = "success") { this.flashMessage = message; this.flashType = type; setTimeout(() => { this.flashMessage = ""; }, 4000); },
        formatDate(isoString) { if (!isoString) return "—"; return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); },
        getDriveBadgeClass(status)       { return ({ approved: "hs-badge-success", completed: "hs-badge-info", cancelled: "hs-badge-danger", pending: "hs-badge-warning" })[status] || "hs-badge-info"; },
        getApplicationBadgeClass(status) { return ({ applied: "hs-badge-info", shortlisted: "hs-badge-warning", selected: "hs-badge-success", rejected: "hs-badge-danger" })[status] || "hs-badge-info"; }
    }
};

/* ================================================================
   STUDENT DASHBOARD
================================================================ */
const StudentDashboard = {
    template: `
        <div class="hs-dashboard">
            <div class="container-fluid px-4 py-4">
                <div class="student-welcome-strip fade-in">
                    <div>
                        <h3>Welcome, {{ studentName }}! 🎓</h3>
                        <p>Browse companies, apply to drives and track your applications.</p>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="student-tab-btn" @click="openEditProfileModal"><i class="bi bi-person-gear"></i> Edit Profile</button>
                        <button class="student-tab-btn" @click="openHistoryModal"><i class="bi bi-clock-history"></i> History</button>
                    </div>
                </div>
                <div v-if="flashMessage" class="alert fade-in mb-3 d-flex align-items-center gap-2" :class="flashType === 'success' ? 'alert-success' : 'alert-danger'" style="border-radius:10px;">
                    <i :class="flashType === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                    {{ flashMessage }}
                </div>
                <div class="student-search-wrap">
                    <i class="bi bi-search s-search-icon"></i>
                    <input type="text" v-model="searchText" placeholder="Search companies by name..." />
                </div>
                <div class="student-table-card">
                    <div class="student-table-header">
                        <div><h5 class="mb-0">🏢 Organizations</h5><small class="text-muted">Approved companies registered on HireSphere</small></div>
                        <span class="badge rounded-pill" style="background:#ccfbf1; color:#0f766e; font-size:0.8rem;">{{ filteredCompanies.length }}</span>
                    </div>
                    <div v-if="loadingCompanies" class="table-loading-state"><div class="spinner-border spinner-border-sm me-2" style="color:#0d9488;"></div> Loading companies...</div>
                    <div v-else-if="filteredCompanies.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">🏢</div><p class="mt-2 text-muted">No companies found.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table student-tbl">
                            <thead><tr><th>#</th><th>Company Name</th><th>Website</th><th>About</th><th>Open Drives</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(company, index) in filteredCompanies" :key="company.id">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ company.company_name }}</td>
                                    <td><a v-if="company.website" :href="company.website" target="_blank" style="color:#0d9488; font-size:0.85rem; word-break:break-all;">{{ company.website }}</a><span v-else class="text-muted">—</span></td>
                                    <td style="max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ company.description || '—' }}</td>
                                    <td><span class="hs-badge hs-badge-info">{{ company.open_drives_count }} drives</span></td>
                                    <td><button class="btn-teal-outline" @click="goToCompanyPage(company.id)"><i class="bi bi-eye me-1"></i>View Details</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="student-table-card">
                    <div class="student-table-header">
                        <div><h5 class="mb-0">📝 Applied Drives</h5><small class="text-muted">All drives you have applied to</small></div>
                        <span class="badge rounded-pill" style="background:#ccfbf1; color:#0f766e; font-size:0.8rem;">{{ myApplications.length }}</span>
                    </div>
                    <div v-if="loadingApplications" class="table-loading-state"><div class="spinner-border spinner-border-sm me-2" style="color:#0d9488;"></div> Loading...</div>
                    <div v-else-if="myApplications.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">📝</div><p class="mt-2 text-muted">You haven't applied to any drives yet.</p></div>
                    <div v-else class="table-responsive">
                        <table class="table student-tbl">
                            <thead><tr><th>#</th><th>Drive Name</th><th>Company</th><th>Applied On</th><th>Interview Date</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                <tr v-for="(app, index) in myApplications" :key="app.id">
                                    <td class="text-muted">{{ index + 1 }}</td>
                                    <td class="fw-semibold">{{ app.drive_name }}</td>
                                    <td>{{ app.company_name }}</td>
                                    <td style="font-size:0.85rem;">{{ niceDate(app.applied_on) }}</td>
                                    <td>
                                        <span v-if="app.interview_date" style="color:#0d9488; font-weight:600; font-size:0.85rem;">📅 {{ app.interview_date }}</span>
                                        <span v-else class="text-muted">—</span>
                                    </td>
                                    <td><span class="hs-badge" :class="statusBadgeClass(app.status)">{{ statusLabel(app.status) }}</span></td>
                                    <td><button class="btn-teal-outline" @click="openAppliedDriveModal(app)"><i class="bi bi-eye me-1"></i>View Details</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <!-- History Modal -->
            <div class="hs-modal-overlay" v-if="showHistoryModal" @click.self="showHistoryModal = false">
                <div class="hs-modal-box fade-in" style="max-width:820px;">
                    <button class="hs-modal-close" @click="showHistoryModal = false"><i class="bi bi-x-lg"></i></button>
                    <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">All Time Record</p>
                    <h4 class="fw-bold mb-1" style="color:#0d9488;">Student Application History</h4>
                    <div v-if="loadingHistory" class="text-center py-4"><div class="spinner-border spinner-border-sm" style="color:#0d9488;"></div></div>
                    <template v-else>
                        <p class="mb-0 fw-semibold" style="font-size:0.95rem; color:#1e293b;">{{ historyStudentName }}</p>
                        <p class="text-muted mb-4" style="font-size:0.85rem;">{{ historyDepartment || '—' }}</p>
                        <div v-if="historyRows.length === 0" class="table-empty-state py-3"><div style="font-size:2rem;">📭</div><p class="mt-2 text-muted">No applications in history yet.</p></div>
                        <div v-else class="table-responsive">
                            <table class="table student-tbl">
                                <thead><tr><th>#</th><th>Drive Name</th><th>Job Title</th><th>Company</th><th>Location</th><th>Interview Date</th><th>Result</th></tr></thead>
                                <tbody>
                                    <tr v-for="(row, index) in historyRows" :key="row.application_id">
                                        <td class="text-muted">{{ index + 1 }}</td>
                                        <td class="fw-semibold">{{ row.drive_name }}</td>
                                        <td>{{ row.job_title }}</td>
                                        <td>{{ row.company_name }}</td>
                                        <td>{{ row.location || '—' }}</td>
                                        <td>
                                            <span v-if="row.interview_date" style="color:#0d9488; font-weight:600; font-size:0.85rem;">📅 {{ row.interview_date }}</span>
                                            <span v-else class="text-muted">—</span>
                                        </td>
                                        <td><span class="hs-badge" :class="statusBadgeClass(row.status)">{{ statusLabel(row.status) }}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </div>
            </div>
            <!-- Edit Profile Modal -->
            <div class="hs-modal-overlay" v-if="showEditProfileModal" @click.self="showEditProfileModal = false">
                <div class="hs-modal-box fade-in" style="max-width:520px;">
                    <button class="hs-modal-close" @click="showEditProfileModal = false"><i class="bi bi-x-lg"></i></button>
                    <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Your Details</p>
                    <h4 class="fw-bold mb-4" style="color:#0d9488;">Edit Profile</h4>
                    <div v-if="profileError" class="hs-alert hs-alert-error mb-3"><i class="bi bi-exclamation-circle me-2"></i>{{ profileError }}</div>
                    <div class="mb-3"><label class="form-label fw-semibold" style="font-size:0.88rem;">Full Name</label><input type="text" class="form-control" v-model="profileForm.full_name" /></div>
                    <div class="row g-3 mb-3">
                        <div class="col-6">
                            <label class="form-label fw-semibold" style="font-size:0.88rem;">Branch / Department</label>
                            <select class="form-control" v-model="profileForm.branch">
                                <option value="">Select branch</option>
                                <option>Computer Science</option><option>Information Technology</option>
                                <option>Electronics & Communication</option><option>Electrical Engineering</option>
                                <option>Mechanical Engineering</option><option>Civil Engineering</option><option>Other</option>
                            </select>
                        </div>
                        <div class="col-6">
                            <label class="form-label fw-semibold" style="font-size:0.88rem;">Current Year</label>
                            <select class="form-control" v-model="profileForm.study_year">
                                <option value="">Select year</option>
                                <option value="1">1st Year</option><option value="2">2nd Year</option>
                                <option value="3">3rd Year</option><option value="4">4th Year</option>
                            </select>
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-6"><label class="form-label fw-semibold" style="font-size:0.88rem;">CGPA</label><input type="number" class="form-control" step="0.1" min="0" max="10" v-model="profileForm.cgpa" /></div>
                        <div class="col-6"><label class="form-label fw-semibold" style="font-size:0.88rem;">Phone</label><input type="tel" class="form-control" v-model="profileForm.phone" /></div>
                    </div>
                    <div class="mb-4"><label class="form-label fw-semibold" style="font-size:0.88rem;">Skills</label><input type="text" class="form-control" placeholder="e.g. Python, React, SQL" v-model="profileForm.skills" /></div>
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-outline-secondary fw-semibold" @click="showEditProfileModal = false">Cancel</button>
                        <button class="btn-teal-solid" style="border-radius:8px; font-size:0.9rem; padding:0.5rem 1.5rem;" @click="saveProfile" :disabled="savingProfile">
                            <span v-if="savingProfile" class="hs-spinner me-2"></span>
                            <i v-if="!savingProfile" class="bi bi-floppy me-2"></i>
                            {{ savingProfile ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </div>
            </div>
            <!-- Applied Drive Details Modal -->
            <div class="hs-modal-overlay" v-if="showAppliedDriveModal" @click.self="showAppliedDriveModal = false">
                <div class="hs-modal-box fade-in">
                    <button class="hs-modal-close" @click="showAppliedDriveModal = false"><i class="bi bi-x-lg"></i></button>
                    <div class="d-flex justify-content-between align-items-start gap-3">
                        <div style="flex:1;">
                            <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Your Application</p>
                            <h4 class="fw-bold mb-4" style="color:#0d9488;">{{ chosenAppliedDrive.drive_name }}</h4>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-briefcase me-2" style="color:#0d9488;"></i>Job Title</span><span class="detail-value">{{ chosenAppliedDrive.job_title }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-file-text me-2" style="color:#0d9488;"></i>Job Description</span><span class="detail-value" style="white-space:pre-wrap;">{{ chosenAppliedDrive.job_description || 'Not provided' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-currency-rupee me-2" style="color:#0d9488;"></i>Salary / Package</span><span class="detail-value">{{ chosenAppliedDrive.salary || 'Not disclosed' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-geo-alt me-2" style="color:#0d9488;"></i>Location</span><span class="detail-value">{{ chosenAppliedDrive.location || 'Not specified' }}</span></div>
                            <div class="drive-detail-row">
                                <span class="detail-label"><i class="bi bi-calendar-event me-2" style="color:#0d9488;"></i>Interview Date</span>
                                <span class="detail-value">
                                    <span v-if="chosenAppliedDrive.interview_date" style="color:#0d9488; font-weight:700;">📅 {{ chosenAppliedDrive.interview_date }}</span>
                                    <span v-else class="text-muted">Not scheduled yet</span>
                                </span>
                            </div>
                            <div class="drive-detail-row">
                                <span class="detail-label"><i class="bi bi-flag me-2" style="color:#0d9488;"></i>Your Status</span>
                                <span class="hs-badge mt-1" :class="statusBadgeClass(chosenAppliedDrive.appStatus)">{{ statusLabel(chosenAppliedDrive.appStatus) }}</span>
                            </div>
                        </div>
                        <div class="company-name-badge" style="background: linear-gradient(135deg, #0f2942, #0d9488);">{{ chosenAppliedDrive.company_name }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            allCompanies: [], myApplications: [], loadingCompanies: true, loadingApplications: true, searchText: "",
            flashMessage: "", flashType: "success",
            showHistoryModal: false, loadingHistory: false, historyStudentName: "", historyDepartment: "", historyRows: [],
            showEditProfileModal: false, savingProfile: false, profileError: "",
            profileForm: { full_name: "", branch: "", study_year: "", cgpa: "", phone: "", skills: "" },
            showAppliedDriveModal: false, chosenAppliedDrive: {}
        };
    },
    computed: {
        studentName() { return currentSession.loggedInUser?.profile?.full_name?.split(" ")[0] || "Student"; },
        filteredCompanies() {
            if (!this.searchText.trim()) return this.allCompanies;
            const q = this.searchText.toLowerCase();
            return this.allCompanies.filter(c => c.company_name.toLowerCase().includes(q));
        }
    },
    async mounted() { await Promise.all([this.fetchCompanies(), this.fetchMyApplications()]); },
    methods: {
        async fetchCompanies() {
            this.loadingCompanies = true;
            const { result, errorMessage } = await callApi("GET", "/student/companies");
            if (result)       this.allCompanies = result.companies;
            if (errorMessage) this.showFlash(errorMessage, "danger");
            this.loadingCompanies = false;
        },
        async fetchMyApplications() {
            this.loadingApplications = true;
            const { result, errorMessage } = await callApi("GET", "/student/my-applications");
            if (result)       this.myApplications = result.applications;
            if (errorMessage) this.showFlash(errorMessage, "danger");
            this.loadingApplications = false;
        },
        goToCompanyPage(companyId) { this.$router.push(`/student/company/${companyId}`); },
        async openHistoryModal() {
            this.showHistoryModal = true; this.loadingHistory = true;
            const { result, errorMessage } = await callApi("GET", "/student/history");
            if (result) { this.historyStudentName = result.student.full_name; this.historyDepartment = result.student.branch; this.historyRows = result.history; }
            if (errorMessage) this.showFlash(errorMessage, "danger");
            this.loadingHistory = false;
        },
        openEditProfileModal() {
            const p = currentSession.loggedInUser?.profile || {};
            this.profileForm = { full_name: p.full_name || "", branch: p.branch || "", study_year: p.year || "", cgpa: p.cgpa || "", phone: p.phone || "", skills: p.skills || "" };
            this.profileError = ""; this.showEditProfileModal = true;
        },
        async saveProfile() {
            this.profileError = "";
            if (!this.profileForm.full_name.trim()) { this.profileError = "Full name cannot be empty."; return; }
            this.savingProfile = true;
            const payload = {
                full_name:  this.profileForm.full_name.trim(),
                branch:     this.profileForm.branch,
                study_year: this.profileForm.study_year ? parseInt(this.profileForm.study_year) : null,
                cgpa:       this.profileForm.cgpa       ? parseFloat(this.profileForm.cgpa)     : null,
                phone:      this.profileForm.phone,
                skills:     this.profileForm.skills
            };
            const { result, errorMessage } = await callApi("POST", "/student/update-profile", payload);
            this.savingProfile = false;
            if (errorMessage) { this.profileError = errorMessage; return; }
            currentSession.saveLogin({ ...currentSession.loggedInUser, profile: result.student });
            this.showEditProfileModal = false;
            this.showFlash("Profile updated successfully!", "success");
        },
        openAppliedDriveModal(app) {
            this.chosenAppliedDrive = {
                drive_name:      app.drive_name,
                job_title:       app.job_title,
                job_description: app.job_description,
                salary:          app.salary,
                location:        app.location,
                company_name:    app.company_name,
                interview_date:  app.interview_date,
                appStatus:       app.status
            };
            this.showAppliedDriveModal = true;
        },
        showFlash(msg, type = "success") { this.flashMessage = msg; this.flashType = type; setTimeout(() => { this.flashMessage = ""; }, 4000); },
        niceDate(iso) { if (!iso) return "—"; return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); },
        statusLabel(status)    { return ({ applied: "Applied", shortlisted: "Shortlisted", selected: "Hired", rejected: "Rejected", cancelled: "Cancelled" })[status] || status; },
        statusBadgeClass(status) { return ({ applied: "hs-badge-info", shortlisted: "hs-badge-warning", selected: "hs-badge-hired", rejected: "hs-badge-danger", cancelled: "hs-badge-danger" })[status] || "hs-badge-info"; }
    }
};

/* ================================================================
   STUDENT COMPANY PAGE
================================================================ */
const StudentCompanyPage = {
    template: `
        <div class="hs-dashboard">
            <div class="container-fluid px-4 py-4">
                <div v-if="loadingPage" class="text-center py-5">
                    <div class="spinner-border" style="color:#0d9488;"></div>
                    <p class="mt-3 text-muted">Loading...</p>
                </div>
                <template v-else-if="companyInfo">
                    <button class="btn btn-sm btn-outline-secondary fw-semibold mb-3" @click="$router.push('/student/dashboard')">
                        <i class="bi bi-arrow-left me-1"></i> Back to Dashboard
                    </button>
                    <div class="company-page-hero fade-in">
                        <div class="d-flex align-items-start gap-3 flex-wrap">
                            <div style="font-size:3rem;">🏢</div>
                            <div>
                                <h2>{{ companyInfo.company_name }}</h2>
                                <p>
                                    <span v-if="companyInfo.industry"><i class="bi bi-building me-1"></i>{{ companyInfo.industry }}</span>
                                    <span v-if="companyInfo.location" class="ms-3"><i class="bi bi-geo-alt me-1"></i>{{ companyInfo.location }}</span>
                                    <a v-if="companyInfo.website" :href="companyInfo.website" target="_blank" class="ms-3" style="color:rgba(255,255,255,0.8); text-decoration:none;"><i class="bi bi-box-arrow-up-right me-1"></i>Website</a>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="about-card fade-in">
                        <h6>About the Company</h6>
                        <p>{{ companyInfo.description || 'No description provided.' }}</p>
                    </div>
                    <div v-if="flashMessage" class="alert fade-in mb-3 d-flex align-items-center gap-2" :class="flashType === 'success' ? 'alert-success' : 'alert-danger'" style="border-radius:10px;">
                        <i :class="flashType === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                        {{ flashMessage }}
                    </div>
                    <div class="student-table-card">
                        <div class="student-table-header">
                            <div><h5 class="mb-0">📋 Current Drives</h5><small class="text-muted">Open placement drives from {{ companyInfo.company_name }}</small></div>
                            <span class="badge rounded-pill" style="background:#ccfbf1; color:#0f766e; font-size:0.8rem;">{{ filteredDrives.length }}</span>
                        </div>
                        <div class="student-search-wrap px-3 pt-3 pb-0">
                            <i class="bi bi-search s-search-icon"></i>
                            <input type="text" v-model="driveSearchText" placeholder="Search by drive name, job title, location, salary or eligibility..." />
                        </div>
                        <div v-if="filteredDrives.length === 0" class="table-empty-state"><div style="font-size:2.5rem;">📋</div><p class="mt-2 text-muted">No drives match your search.</p></div>
                        <div v-else class="table-responsive">
                            <table class="table student-tbl">
                                <thead><tr><th>#</th><th>Drive Name</th><th>Job Title</th><th>Location</th><th>Salary</th><th>Eligibility</th><th>Deadline</th><th>Action</th></tr></thead>
                                <tbody>
                                    <tr v-for="(drive, index) in filteredDrives" :key="drive.id">
                                        <td class="text-muted">{{ index + 1 }}</td>
                                        <td class="fw-semibold">{{ drive.drive_name }}</td>
                                        <td>{{ drive.job_title }}</td>
                                        <td>{{ drive.location || '—' }}</td>
                                        <td>{{ drive.salary || '—' }}</td>
                                        <td>{{ drive.eligible_branches || '—' }}</td>
                                        <td style="font-size:0.85rem;">{{ drive.application_deadline || '—' }}</td>
                                        <td><button class="btn-teal-outline" @click="openDriveModal(drive)"><i class="bi bi-eye me-1"></i>View Details</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </template>
                <div v-else class="text-center py-5">
                    <div style="font-size:3rem;">🔍</div>
                    <p class="mt-3 text-muted">Company not found.</p>
                    <button class="btn btn-primary mt-2" @click="$router.push('/student/dashboard')">Go Back</button>
                </div>
            </div>
            <!-- Drive Details + Apply Modal -->
            <div class="hs-modal-overlay" v-if="showDriveModal" @click.self="showDriveModal = false">
                <div class="hs-modal-box fade-in">
                    <button class="hs-modal-close" @click="showDriveModal = false"><i class="bi bi-x-lg"></i></button>
                    <div class="d-flex justify-content-between align-items-start gap-3">
                        <div style="flex:1;">
                            <p class="text-muted mb-1" style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; font-weight:600;">Drive Details</p>
                            <h4 class="fw-bold mb-4" style="color:#0d9488;">{{ chosenDrive.drive_name }}</h4>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-briefcase me-2" style="color:#0d9488;"></i>Job Title</span><span class="detail-value">{{ chosenDrive.job_title }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-file-text me-2" style="color:#0d9488;"></i>Job Description</span><span class="detail-value" style="white-space:pre-wrap;">{{ chosenDrive.job_description || 'Not specified' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-currency-rupee me-2" style="color:#0d9488;"></i>Salary / Package</span><span class="detail-value">{{ chosenDrive.salary || 'Not disclosed' }}</span></div>
                            <div class="drive-detail-row"><span class="detail-label"><i class="bi bi-geo-alt me-2" style="color:#0d9488;"></i>Location</span><span class="detail-value">{{ chosenDrive.location || 'Not specified' }}</span></div>
                            <div v-if="chosenDrive.application_deadline" class="drive-detail-row"><span class="detail-label"><i class="bi bi-calendar-x me-2" style="color:#0d9488;"></i>Application Deadline</span><span class="detail-value">{{ chosenDrive.application_deadline }}</span></div>
                            <div v-if="chosenDrive.eligible_branches" class="drive-detail-row"><span class="detail-label"><i class="bi bi-people me-2" style="color:#0d9488;"></i>Eligibility</span><span class="detail-value">{{ chosenDrive.eligible_branches }}</span></div>
                            <!-- PATCH 4b: Eligibility warning + resume upload -->
                            <div class="mt-4 pt-3 border-top">
                                <div v-if="!chosenDrive.already_applied">
                                    <!-- PATCH 4b: eligibility warning banner -->
                                    <div v-if="eligibilityWarning && eligibilityWarning.length"
                                         class="alert alert-warning py-2 px-3 mb-3"
                                         style="border-radius:8px; font-size:0.85rem; border:1.5px solid #fbbf24;">
                                        <strong>⚠️ Eligibility Check</strong>
                                        <ul class="mb-0 mt-1 ps-3">
                                            <li v-for="w in eligibilityWarning" :key="w">{{ w }}</li>
                                        </ul>
                                        <small class="d-block mt-1 text-muted">The server will reject the application if you don't meet the criteria.</small>
                                    </div>
                                    <p class="fw-semibold mb-2" style="font-size:0.88rem; color:#374151;">
                                        <i class="bi bi-paperclip me-1" style="color:#0d9488;"></i>
                                        Upload your Resume to Apply
                                    </p>
                                    <div class="mb-3">
                                        <input type="file" accept=".pdf" class="form-control" style="border:1.5px solid #ccfbf1; border-radius:8px; font-size:0.88rem;" @change="onResumeSelected" ref="resumeInput" />
                                        <small class="text-muted">PDF only. This will be visible to the company and admin.</small>
                                    </div>
                                    <div v-if="resumeError" class="hs-alert hs-alert-error mb-3"><i class="bi bi-exclamation-circle me-2"></i>{{ resumeError }}</div>
                                    <div class="text-center">
                                        <button class="btn-teal-solid px-5" @click="applyNow" :disabled="applyingNow || !selectedResume">
                                            <span v-if="applyingNow" class="hs-spinner me-2"></span>
                                            <i v-if="!applyingNow" class="bi bi-send me-2"></i>
                                            {{ applyingNow ? 'Submitting...' : 'Apply Now' }}
                                        </button>
                                    </div>
                                </div>
                                <div v-else class="text-center hs-badge hs-badge-success" style="font-size:0.9rem; padding:0.5rem 1.5rem; display:inline-block;">
                                    <i class="bi bi-check-circle me-2"></i>Already Applied
                                </div>
                            </div>
                        </div>
                        <div class="company-name-badge" style="background: linear-gradient(135deg, #0f2942, #0d9488);">
                            {{ companyInfo ? companyInfo.company_name : '' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            companyInfo: null, openDrives: [], loadingPage: true, driveSearchText: "",
            flashMessage: "", flashType: "success",
            showDriveModal: false, chosenDrive: {},
            applyingNow: false, selectedResume: null, resumeError: "",
            // PATCH 3: eligibility warning state
            eligibilityWarning: null
        };
    },
    computed: {
        filteredDrives() {
            if (!this.driveSearchText.trim()) return this.openDrives;
            const q = this.driveSearchText.toLowerCase();
            return this.openDrives.filter(d =>
                d.drive_name.toLowerCase().includes(q)             ||
                d.job_title.toLowerCase().includes(q)              ||
                (d.location          || "").toLowerCase().includes(q) ||
                (d.salary            || "").toLowerCase().includes(q) ||
                (d.eligible_branches || "").toLowerCase().includes(q)
            );
        }
    },
    async mounted() {
        const companyId = this.$route.params.id;
        const { result, errorMessage } = await callApi("GET", `/student/company/${companyId}`);
        if (result) { this.companyInfo = result.company; this.openDrives = result.drives; }
        if (errorMessage) this.showFlash(errorMessage, "danger");
        this.loadingPage = false;
    },
    methods: {
        // PATCH 4: openDriveModal now runs eligibility check
        openDriveModal(drive) {
            this.chosenDrive        = { ...drive };
            this.selectedResume     = null;
            this.resumeError        = "";
            this.eligibilityWarning = this.checkEligibility(drive);
            this.showDriveModal     = true;
        },
        // PATCH 4: new helper
        checkEligibility(drive) {
            const profile = currentSession.loggedInUser?.profile;
            if (!profile) return null;
            const warnings = [];

            // ── Normalise unicode comparison symbols ──────────────────────
            const rawText = (drive.eligible_branches || "")
                .replace(/≥/g, ">=").replace(/≤/g, "<=")
                .replace(/⩾/g, ">=").replace(/⩽/g, "<=");

            // ── 1. CGPA check ─────────────────────────────────────────────
            // Parse "CGPA > 8.0", "CGPA >= 7.5", "cgpa=8" from the text
            let cgpaOp = null, cgpaVal = null;
            const cgpaMatch = rawText.match(/cgpa\s*(>=|<=|>|<|=)\s*(\d+\.?\d*)/i);
            if (cgpaMatch) {
                cgpaOp  = cgpaMatch[1];
                cgpaVal = parseFloat(cgpaMatch[2]);
            } else if (drive.minimum_cgpa) {
                cgpaOp  = ">=";
                cgpaVal = parseFloat(drive.minimum_cgpa);
            }

            if (cgpaOp !== null && cgpaVal !== null) {
                const studentCgpa = profile.cgpa ? parseFloat(profile.cgpa) : null;
                if (studentCgpa === null) {
                    warnings.push(`Requires CGPA ${cgpaOp} ${cgpaVal} — update your profile first.`);
                } else {
                    let passes = false;
                    if (cgpaOp === ">")  passes = studentCgpa > cgpaVal;
                    if (cgpaOp === ">=") passes = studentCgpa >= cgpaVal;
                    if (cgpaOp === "<")  passes = studentCgpa < cgpaVal;
                    if (cgpaOp === "<=") passes = studentCgpa <= cgpaVal;
                    if (cgpaOp === "=")  passes = studentCgpa === cgpaVal;
                    if (!passes) warnings.push(`CGPA requirement: ${cgpaOp} ${cgpaVal} (yours: ${profile.cgpa})`);
                }
            }

            // ── 2. Year of study check ────────────────────────────────────
            // Supports "3rd year and above", "4th Year", "Year 2", "3rd year+"
            let reqYear = null, yearIsMin = false;
            const aboveMatch = rawText.match(/(\d+)(st|nd|rd|th)?\s*year\s*(and\s*above|or\s*above|\+)/i);
            const yearMatch  = rawText.match(/(\d+)(st|nd|rd|th)?\s*year/i)
                            || rawText.match(/year\s*(\d+)/i);
            if (yearMatch) {
                reqYear   = parseInt(yearMatch[1]);
                yearIsMin = !!aboveMatch;
            } else if (drive.eligible_year) {
                reqYear   = parseInt(drive.eligible_year);
                yearIsMin = false;
            }

            if (reqYear !== null) {
                const studentYear = profile.year ? parseInt(profile.year) : null;
                if (studentYear === null) {
                    warnings.push(`Open for Year ${reqYear}${yearIsMin ? " and above" : ""} only — update your profile first.`);
                } else {
                    const passesYear = yearIsMin ? studentYear >= reqYear : studentYear === reqYear;
                    if (!passesYear) {
                        const qualifier = yearIsMin ? `Year ${reqYear} and above` : `Year ${reqYear}`;
                        warnings.push(`Required: ${qualifier} (yours: Year ${studentYear})`);
                    }
                }
            }

            // ── 3. Branch check (informational warning only) ──────────────
            // Strip CGPA and year tokens from the text; remaining comma-parts = branch hints
            if (profile.branch) {
                const stopwords = new Set([
                    "students","student","only","and","or","above",
                    "minimum","min","required","all","any","with","having",
                    "branches","branch","year","years"
                ]);
                let clean = rawText
                    .replace(/cgpa\s*(>=|<=|>|<|=)\s*\d+\.?\d*/gi, "")
                    .replace(/(\d+)(st|nd|rd|th)?\s*year(\s*(and|or)\s*above|\+)?/gi, "")
                    .replace(/year\s*\d+(\s*(and|or)\s*above|\+)?/gi, "");
                const parts = clean.split(",")
                    .map(p => p.trim())
                    .filter(p => p.length > 1 && !stopwords.has(p.toLowerCase()));
                if (parts.length > 0) {
                    const sb = profile.branch.toLowerCase();
                    const branchOk = parts.some(p => sb.includes(p.toLowerCase()) || p.toLowerCase().includes(sb));
                    if (!branchOk)
                        warnings.push(`Your branch (${profile.branch}) may not be eligible. Check: ${parts.join(", ")}`);
                }
            }

            return warnings.length ? warnings : null;
        },
        onResumeSelected(event) {
            const file = event.target.files[0];
            if (!file) { this.selectedResume = null; return; }
            if (!file.name.toLowerCase().endsWith(".pdf")) { this.resumeError = "Only PDF files are accepted."; this.selectedResume = null; return; }
            this.resumeError = ""; this.selectedResume = file;
        },
        async applyNow() {
            this.resumeError = "";
            if (!this.selectedResume) { this.resumeError = "Please select your resume PDF before applying."; return; }
            this.applyingNow = true;
            const formData = new FormData();
            formData.append("resume", this.selectedResume);
            try {
                const response = await fetch(`/api/student/apply/${this.chosenDrive.id}`, { method: "POST", body: formData, credentials: "include" });
                const result = await response.json();
                if (!response.ok) { this.resumeError = result.error || "Something went wrong."; this.applyingNow = false; return; }
                this.chosenDrive.already_applied = true;
                const idx = this.openDrives.findIndex(d => d.id === this.chosenDrive.id);
                if (idx !== -1) this.openDrives[idx].already_applied = true;
                this.showFlash(result.message, "success");
            } catch (err) {
                this.resumeError = "Network error. Please try again.";
            }
            this.applyingNow = false;
        },
        showFlash(msg, type = "success") { this.flashMessage = msg; this.flashType = type; setTimeout(() => { this.flashMessage = ""; }, 4000); }
    }
};

/* ================================================================
   NOT FOUND
================================================================ */
const NotFoundPage = {
    template: `
        <div class="text-center py-5 mt-5">
            <div style="font-size:5rem;">🔍</div>
            <h2 class="fw-bold mt-3">Page Not Found</h2>
            <p class="text-muted">The page you're looking for doesn't exist.</p>
            <router-link to="/" class="btn btn-primary fw-semibold">Go Home</router-link>
        </div>
    `
};

/* ================================================================
   ROUTER
================================================================ */
const pageRouter = createRouter({
    history: createWebHashHistory(),
    scrollBehavior() { return { top: 0 }; },
    routes: [
        { path: "/",         component: LandingPage  },
        { path: "/login",    component: LoginPage    },
        { path: "/register", component: RegisterPage },
        { path: "/admin/dashboard",     component: AdminDashboard,     meta: { mustBeLoggedIn: true, allowedRole: "admin"   } },
        { path: "/student/dashboard",   component: StudentDashboard,   meta: { mustBeLoggedIn: true, allowedRole: "student" } },
        { path: "/student/company/:id", component: StudentCompanyPage, meta: { mustBeLoggedIn: true, allowedRole: "student" } },
        { path: "/company/dashboard",   component: CompanyDashboard,   meta: { mustBeLoggedIn: true, allowedRole: "company" } },
        { path: "/:pathMatch(.*)*", component: NotFoundPage }
    ]
});

pageRouter.beforeEach((goingTo, comingFrom, proceedWith) => {
    const userIsLoggedIn = currentSession.isLoggedIn;
    const loggedInUser   = currentSession.loggedInUser;
    if (goingTo.meta.mustBeLoggedIn && !userIsLoggedIn)                          return proceedWith("/login");
    if (goingTo.meta.allowedRole && loggedInUser?.role !== goingTo.meta.allowedRole) return proceedWith(`/${loggedInUser.role}/dashboard`);
    if ((goingTo.path === "/login" || goingTo.path === "/register") && userIsLoggedIn) return proceedWith(`/${loggedInUser.role}/dashboard`);
    proceedWith();
});

/* ================================================================
   ROOT SHELL
================================================================ */
const RootShell = {
    template: `
        <div>
            <nav class="navbar navbar-expand-lg hs-navbar fixed-top">
                <div class="container">
                    <router-link to="/" class="navbar-brand">🔷 Hire<span>Sphere</span></router-link>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="mainNav">
                        <ul class="navbar-nav ms-auto align-items-center gap-2">
                            <template v-if="!userIsLoggedIn">
                                <li class="nav-item"><router-link to="/" class="nav-link">Home</router-link></li>
                                <li class="nav-item"><router-link to="/login" class="btn btn-outline-primary btn-sm fw-semibold px-3">Login</router-link></li>
                                <li class="nav-item"><router-link to="/register" class="btn btn-primary btn-sm fw-semibold px-3">Register Free</router-link></li>
                            </template>
                            <template v-if="userIsLoggedIn">
                                <li class="nav-item">
                                    <router-link :to="myDashboard" class="nav-link fw-semibold"><i class="bi bi-grid me-1"></i>Dashboard</router-link>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" data-bs-toggle="dropdown">
                                        <div style="width:32px; height:32px; border-radius:50%; background:var(--hs-blue); color:white; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;">{{ nameInitial }}</div>
                                        <span>{{ displayedName }}</span>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                        <li><span class="dropdown-item-text text-muted small">Signed in as <strong>{{ whoIsLoggedIn?.email }}</strong></span></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><router-link :to="myDashboard" class="dropdown-item"><i class="bi bi-grid me-2"></i>Dashboard</router-link></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item text-danger" href="#" @click.prevent="doLogout"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                                    </ul>
                                </li>
                            </template>
                        </ul>
                    </div>
                </div>
            </nav>
            <div style="padding-top:62px;">
                <router-view></router-view>
            </div>
            <footer class="hs-footer">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-md-4 mb-3 mb-md-0">
                            <div class="brand">🔷 Hire<span>Sphere</span></div>
                            <div style="font-size:0.8rem; margin-top:4px;">Smart Campus Recruitment, Simplified.</div>
                        </div>
                        <div class="col-md-4 text-center"><small>© 2025 HireSphere. All rights reserved.</small></div>
                        <div class="col-md-4 text-md-end"><small><a href="#" class="text-muted text-decoration-none me-3">Privacy</a><a href="#" class="text-muted text-decoration-none">Contact</a></small></div>
                    </div>
                </div>
            </footer>
        </div>
    `,
    computed: {
        userIsLoggedIn() { return currentSession.isLoggedIn; },
        whoIsLoggedIn()  { return currentSession.loggedInUser; },
        displayedName() {
            const person = currentSession.loggedInUser;
            if (!person) return "";
            if (person.role === "admin")   return "Admin";
            if (person.role === "student") return person.profile?.full_name?.split(" ")[0] || "Student";
            if (person.role === "company") return person.profile?.company_name || "Company";
            return person.email;
        },
        nameInitial() { return this.displayedName.charAt(0).toUpperCase(); },
        myDashboard()  { const role = currentSession.loggedInUser?.role; return role ? `/${role}/dashboard` : "/"; }
    },
    methods: {
        async doLogout() { await callApi("POST", "/auth/logout"); currentSession.clearLogin(); this.$router.push("/"); }
    }
};

createApp(RootShell).use(pageRouter).mount("#app");