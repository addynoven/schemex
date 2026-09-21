# Scheme Mobile App — E2E Test Suite

- **Date**: 2026-09-21 21:07:28
- **Total Duration**: 91.15s
- **Total Tests**: 22 | **Passed**: 22 | **Failed**: 0

| Module | Test Case | Status | Time | Screenshot | Note |
|:---|:---|:---:|:---:|:---|:---|
| Onboarding | Language Selection Screen Appears | ✅ PASS | 7.1s | [01_language_selection_view.png](screenshots/01_language_selection_view.png) | Detected English & Hindi options |
| Onboarding | Hindi Option Available | ✅ PASS | 0.0s | - | Found Hindi card with Devanagari typography |
| Onboarding | Language Confirm & Route to Auth | ✅ PASS | 2.91s | [02_auth_screen_after_onboarding.png](screenshots/02_auth_screen_after_onboarding.png) | Transitioned to /auth seamlessly |
| Authentication | Auth Screen Structure | ✅ PASS | 0.32s | [03_auth_initial_view.png](screenshots/03_auth_initial_view.png) | Google Sign-In & Login tab present |
| Authentication | Sign Up View Toggle | ✅ PASS | 2.63s | [04_signup_view.png](screenshots/04_signup_view.png) | Full Name & registration form visible |
| Authentication | Email Login & Navigation to Tabs | ✅ PASS | 9.14s | [05_post_login_tabs_view.png](screenshots/05_post_login_tabs_view.png) | Authenticated citizen loaded into tabs |
| Schemes Discovery | Schemes Tab & Offline DB | ✅ PASS | 2.9s | [06_schemes_list_initial.png](screenshots/06_schemes_list_initial.png) | SQLite database schemes loaded (4147+ schemes) |
| Schemes Discovery | Live Instant Search | ✅ PASS | 3.36s | [07_schemes_search_kisan.png](screenshots/07_schemes_search_kisan.png) | Filtered schemes by 'Kisan' instantly offline |
| Schemes Discovery | Scheme Detail Navigation | ✅ PASS | 3.09s | [08_scheme_detail_view.png](screenshots/08_scheme_detail_view.png) | Scheme details, criteria & benefits rendered |
| Eligibility Checker | Eligibility Tab Entry | ✅ PASS | 5.03s | [09_eligibility_quiz_start.png](screenshots/09_eligibility_quiz_start.png) | Navigated to eligibility questionnaire |
| Eligibility Checker | Demographic & Economic Input | ✅ PASS | 5.82s | [11_eligibility_step2_economics.png](screenshots/11_eligibility_step2_economics.png) | Demographic & economic criteria entered |
| Eligibility Checker | Eligibility Scoring Engine | ✅ PASS | 4.68s | [12_eligibility_scoring_results.png](screenshots/12_eligibility_scoring_results.png) | Offline rule engine evaluated matched schemes |
| Eligibility Checker | View Scheme Details from Check | ✅ PASS | 3.21s | [13_check_view_details_scheme_screen.png](screenshots/13_check_view_details_scheme_screen.png) | Navigated directly to Schemes Tab Detail Screen with full tabs & benefits |
| Document Vault | Vault Hub Entry | ✅ PASS | 2.93s | [13_vault_hub_view.png](screenshots/13_vault_hub_view.png) | Vault dashboard rendered with encryption indicators |
| Document Vault | Scheme Readiness Meter | ✅ PASS | 2.98s | [14_vault_readiness_meter.png](screenshots/14_vault_readiness_meter.png) | Evaluated required documents checklist & readiness percentage |
| AI Scheme Advisor | Advisor Screen Entry | ✅ PASS | 4.92s | [15_advisor_chat_view.png](screenshots/15_advisor_chat_view.png) | Navigated to AI Advisor interface |
| AI Scheme Advisor | AI Recommendations & Citations | ✅ PASS | 3.44s | [16_advisor_response_recommendations.png](screenshots/16_advisor_response_recommendations.png) | Instant offline AI scheme match & citations returned |
| AI Scheme Advisor | Custom Chat Query & User Bubble | ✅ PASS | 6.4s | [16b_advisor_custom_chat_reply.png](screenshots/16b_advisor_custom_chat_reply.png) | User message sent and verified in chat stream |
| AI Scheme Advisor | Consultation History Drawer | ✅ PASS | 2.91s | [16c_advisor_history_drawer.png](screenshots/16c_advisor_history_drawer.png) | Past consultation sessions listed; new session ready |
| Profile & Settings | Settings Screen Entry | ✅ PASS | 5.55s | [17_settings_screen_initial.png](screenshots/17_settings_screen_initial.png) | Settings screen rendered |
| Profile & Settings | In-App Language Switch & Return | ✅ PASS | 1.58s | [19_settings_after_language_change.png](screenshots/19_settings_after_language_change.png) | Language updated; session preserved |
| Profile & Settings | Logout Flow & Session Purge | ✅ PASS | 3.65s | [21_logged_out_screen.png](screenshots/21_logged_out_screen.png) | Session wiped; returned to Auth |