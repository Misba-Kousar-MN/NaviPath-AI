import test from "node:test";
import assert from "node:assert/strict";
//#endregion
//#region src/mocks/scenarios.ts
const DEMO_SCENARIOS = [
	{
		id: "delivery-to-electrician",
		name: "Delivery Rider → Electrician",
		badge: "Logistics to Electrical",
		description: "Transition from gig food/parcel delivery to certified domestic electrical installation in Bengaluru Urban.",
		initialProfile: {
			occupation: "Delivery / Courier Rider",
			district: "Bengaluru Urban",
			education: "10th Pass",
			career_goal_text: "I want to become a certified electrician and do domestic installations",
			language: "kn",
			age: 26,
			gender: "Male",
			pincode: "560022",
			latitude: null,
			longitude: null,
			session_id: "demo-sess-001"
		},
		response: {
			profile: {
				occupation: "Delivery / Courier Rider",
				district: "Bengaluru Urban",
				education: "10th Pass",
				career_goal_text: "I want to become a certified electrician and do domestic installations",
				language: "kn",
				age: 26,
				gender: "Male",
				pincode: "560022",
				latitude: null,
				longitude: null,
				session_id: "demo-sess-001"
			},
			matched_occupation: {
				id: "occ-001",
				name_en: "Delivery / Courier Rider",
				name_kn: "ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್",
				name_hi: "डिलीवरी / कूरियर राइडर",
				sector: "Logistics & Gig Economy",
				nco_code: "8322.0401",
				is_informal_sector: true,
				description: "Two-wheeler parcel/food delivery executive in urban centres."
			},
			current_skills: [{
				id: "skl-001",
				name_en: "Two-Wheeler Driving & Route Navigation",
				name_kn: "ದ್ವಿಚಕ್ರ ವಾಹನ ಚಾಲನೆ ಮತ್ತು ನ್ಯಾವಿಗೇಷನ್",
				category: "Operational",
				skill_level: "Level 2"
			}, {
				id: "skl-002",
				name_en: "Customer Interaction & Mobile App Literacy",
				name_kn: "ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ",
				category: "Service",
				skill_level: "Level 2"
			}],
			recommended_pathways: [{
				target_skill: {
					id: "skl-004",
					name_en: "Electrician (Domestic / Installation)",
					name_kn: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)",
					name_hi: "इलेक्ट्रीशियन (घरेलू / वायरिंग)",
					category: "Technical Trades",
					skill_level: "Level 3"
				},
				bridge_skills: [{
					id: "skl-005",
					name_en: "Basic Electrical Safety & Hand Tools",
					name_kn: "ಮೂಲ ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣಗಳ ಬಳಕೆ",
					category: "Foundational Technical",
					skill_level: "Level 2"
				}],
				rationale: "High urban demand for domestic electrical repairs; your mobile navigation and customer handling transfer well into on-site service visits; foundational safety training enables swift entry.",
				confidence: "expert-curated",
				courses: [{
					id: "crs-002",
					title: "Domestic Solutions Electrician (NSQF Level 3)",
					skill_id: "skl-004",
					level: "NSQF Level 3",
					duration_value: 350,
					duration_unit: "hours",
					mode: "offline",
					is_government_recognized: true,
					certifying_body: "NCVT / NSDC",
					fee_type: "free",
					fee_amount_inr: 0,
					source_id: "src-004",
					provider: "Karnataka Skill Development Corporation (KSDC) / CMKKY"
				}],
				centres: [{
					id: "tc-001",
					name: "National Skill Training Institute (NSTI) Bengaluru",
					district: "Bengaluru Urban",
					taluk: "Bengaluru North",
					address: "Outer Ring Road, Yeshwanthpur, Bengaluru, Karnataka 560022",
					latitude: 13.0285,
					longitude: 77.5452,
					recognition_status: "govt-recognized",
					contact_phone: "+91 80 2337 1311",
					distance_km: 4.2,
					distance_type: "exact"
				}]
			}],
			skill_gaps: [{
				skill_id: "skl-004",
				skill_name: "Electrician (Domestic / Installation)",
				skill_category: "Technical Trades",
				gap_type: "target",
				rationale: "Core technical competency required for electrical wiring and certification.",
				has_it: false,
				how_to_close: "Complete NSQF Level 3 Domestic Electrician Course (crs-002)"
			}, {
				skill_id: "skl-005",
				skill_name: "Basic Electrical Safety & Tool Handling",
				skill_category: "Foundational Technical",
				gap_type: "bridge",
				rationale: "Mandatory prerequisite module on shock prevention, earthing, and multimeters.",
				has_it: false,
				how_to_close: "Covered in Module 1 of accredited electrician curriculum"
			}],
			courses: [{
				id: "crs-002",
				title: "Domestic Solutions Electrician (NSQF Level 3)",
				skill_id: "skl-004",
				level: "NSQF Level 3",
				duration_value: 350,
				duration_unit: "hours",
				mode: "offline",
				is_government_recognized: true,
				certifying_body: "National Council for Vocational Training (NCVT)",
				fee_type: "free",
				fee_amount_inr: 0,
				source_id: "src-004",
				provider: "Karnataka Skill Development Corporation (KSDC) / CMKKY"
			}],
			nearby_centres: [{
				id: "tc-001",
				name: "National Skill Training Institute (NSTI) Bengaluru",
				district: "Bengaluru Urban",
				taluk: "Bengaluru North",
				address: "Outer Ring Road, Yeshwanthpur, Bengaluru, Karnataka 560022",
				latitude: 13.0285,
				longitude: 77.5452,
				recognition_status: "govt-recognized",
				contact_phone: "+91 80 2337 1311",
				distance_km: 4.2,
				distance_type: "exact"
			}, {
				id: "tc-002",
				name: "Government Industrial Training Institute (ITI) Bengaluru Peenya",
				district: "Bengaluru Urban",
				taluk: "Bengaluru North",
				address: "Peenya 1st Stage, Near SRS Road, Bengaluru, Karnataka 560058",
				latitude: 13.0312,
				longitude: 77.5188,
				recognition_status: "govt-recognized",
				contact_phone: "+91 80 2839 4520",
				distance_km: 6.8,
				distance_type: "exact"
			}],
			schemes: [{
				id: "sch-001",
				name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
				name_kn: "ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ",
				name_hi: "मुख्यमंत्री कौशल कर्नाटक योजना",
				issuing_authority: "Karnataka Skill Development Corporation (KSDC)",
				scheme_type: "Vocational Training & Subsidy",
				benefit_summary: "100% free government skill training, industry-recognized NCVT certificate, and minimum 70% job placement assistance.",
				official_url: "https://kaushalkar.karnataka.gov.in",
				status: "active"
			}, {
				id: "sch-002",
				name_en: "e-Shram Portal Social Security & UAN",
				name_kn: "ಇ-ಶ್ರಮ್ ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಯುಎಎನ್",
				name_hi: "ई-श्रम सामाजिक सुरक्षा एवं यूएएन",
				issuing_authority: "Ministry of Labour & Employment, Govt of India",
				scheme_type: "Social Security Registration",
				benefit_summary: "Universal unorganised worker UAN card with accident insurance cover under PMSBY and direct social security integration.",
				official_url: "https://eshram.gov.in",
				status: "active"
			}],
			eligibility: [{
				scheme_id: "sch-001",
				scheme_name: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
				verdict: "eligible",
				reasons: [
					{
						rule_id: "rule-01",
						field_path: "profile.district",
						human_readable_condition: "Resident of Karnataka (Bengaluru Urban)",
						result: "pass"
					},
					{
						rule_id: "rule-02",
						field_path: "profile.age",
						human_readable_condition: "Age between 18 and 35 years (Age 26)",
						result: "pass"
					},
					{
						rule_id: "rule-03",
						field_path: "profile.education",
						human_readable_condition: "Minimum educational qualification 10th pass",
						result: "pass"
					}
				],
				required_documents: [{
					document_id: "doc-001",
					document_name: "Aadhaar Card (Mobile Linked)",
					name_kn: "ಆಧಾರ್ ಕಾರ್ಡ್",
					mandatory: true,
					description: "Required for biometric verification and DBT benefits"
				}, {
					document_id: "doc-002",
					document_name: "10th Standard Passing Certificate / Marks Card",
					name_kn: "೧೦ನೇ ತರಗತಿ ಅಂಕಪಟ್ಟಿ",
					mandatory: true,
					description: "Required for technical admission qualification"
				}]
			}, {
				scheme_id: "sch-002",
				scheme_name: "e-Shram Portal Social Security",
				verdict: "eligible",
				reasons: [{
					rule_id: "rule-04",
					field_path: "profile.age",
					human_readable_condition: "Age between 16 and 59 years",
					result: "pass"
				}],
				required_documents: [{
					document_id: "doc-001",
					document_name: "Aadhaar Card",
					mandatory: true
				}, {
					document_id: "doc-003",
					document_name: "Active Bank Account Passbook",
					mandatory: true
				}]
			}],
			documents: [{
				document_id: "doc-001",
				document_name: "Aadhaar Card (Linked to Mobile Number)",
				mandatory: true,
				description: "Required for CMKKY biometric registration and e-Shram verification."
			}, {
				document_id: "doc-002",
				document_name: "10th Standard Marks Card",
				mandatory: true,
				description: "Proof of basic academic eligibility for NSQF technical course."
			}],
			evidence_count: 3,
			warnings: [],
			explanation: {
				summary: "Based on your background in delivery and logistics, your strong street navigation and customer handling make domestic electrical service an ideal upward mobility pathway in Bengaluru Urban.",
				skill_gap_explanation: "Your primary transition gap is certified electrical safety and circuit wiring (NSQF Level 3). You already have foundational navigation and client service skills.",
				pathway_explanation: "Government-accredited technical training at NSTI Yeshwanthpur provides full hands-on laboratory experience, tools, and placement support under CMKKY.",
				next_steps: [
					"Register on the official e-Shram portal (eshram.gov.in) to obtain your 12-digit UAN card.",
					"Prepare your Aadhaar card and 10th standard marks card for course admission.",
					"Visit NSTI Bengaluru (Outer Ring Road, Yeshwanthpur) or apply on kaushalkar.karnataka.gov.in for the upcoming free CMKKY batch.",
					"Complete the 350-hour practical electrical module to earn certified NCVT credential."
				],
				limitations: ["Training batches are scheduled subject to verified seat availability at the institute."]
			},
			validated_evidence: [{
				chunk_id: "chk-034",
				source_id: "src-008",
				authority: "Directorate General of Training (DGT), Ministry of Skill Development",
				excerpt: "CTS Electrician curriculum emphasizes domestic wiring, earthing, multimeters, and safety protocols for formal trade qualification.",
				page_or_section: "DGT CTS Electrician Guidelines",
				source_url: "https://dgt.gov.in"
			}, {
				chunk_id: "chk-004",
				source_id: "src-004",
				authority: "Karnataka Skill Development Corporation (KSDC)",
				excerpt: "CMKKY provides 100% tuition-free skill training for eligible Karnataka youth with designated industry placement quotas.",
				page_or_section: "CMKKY Guidelines, Section 3.2",
				source_url: "https://kaushalkar.karnataka.gov.in"
			}],
			explanation_status: "available",
			evidence_status: "retrieved",
			skill_bridge: {
				current_occupation: {
					id: "occ-001",
					name_en: "Delivery / Courier Rider",
					name_kn: "ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್",
					name_hi: "डिलीवरी / कूरियर राइडर",
					sector: "Logistics & Gig Economy",
					nco_code: "8322.0401",
					is_informal_sector: true,
					description: "Two-wheeler parcel/food delivery executive in urban centres."
				},
				current_skills: [{
					id: "skl-001",
					name_en: "Two-Wheeler Driving & Route Navigation",
					name_kn: "ದ್ವಿಚಕ್ರ ವಾಹನ ಚಾಲನೆ ಮತ್ತು ನ್ಯಾವಿಗೇಷನ್",
					category: "Operational",
					skill_level: "Level 2"
				}, {
					id: "skl-002",
					name_en: "Customer Interaction & Mobile App Literacy",
					name_kn: "ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ",
					category: "Service",
					skill_level: "Level 2"
				}],
				warnings: [],
				pathways: [{
					transition_id: "trans-001-primary",
					pathway_type: "bridge",
					confidence: "expert-curated",
					confidence_note: "High-feasibility trade transition; logistics mobile app literacy and navigation transfer directly to on-site domestic electrical maintenance visits.",
					current_occupation: {
						id: "occ-001",
						name_en: "Delivery / Courier Rider",
						name_kn: "ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್",
						name_hi: "डिलीवरी / कूरियर राइडर",
						sector: "Logistics & Gig Economy",
						nco_code: "8322.0401",
						is_informal_sector: true,
						description: "Two-wheeler parcel/food delivery executive in urban centres."
					},
					target_occupation: {
						id: "occ-010",
						name_en: "Electrician (Domestic / Installation)",
						name_kn: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)",
						name_hi: "इलेक्ट्रीशियन (घरेलू / वायरिंग)",
						sector: "Technical Trades & Construction",
						nco_code: "7411.0100",
						is_informal_sector: false,
						description: "Certified domestic wireman and electrical equipment installer."
					},
					target_skill: {
						id: "skl-004",
						name_en: "Electrician (Domestic / Installation)",
						name_kn: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)",
						name_hi: "इलेक्ट्रीशियन (घरेलू / वायरिंग)",
						category: "Technical Trades",
						skill_level: "Level 3",
						is_certifiable: true,
						certifying_body: "NCVT / DGT"
					},
					current_skills: [{
						id: "skl-001",
						name_en: "Two-Wheeler Driving & Route Navigation",
						name_kn: "ದ್ವಿಚಕ್ರ ವಾಹನ ಚಾಲನೆ ಮತ್ತು ನ್ಯಾವಿಗೇಷನ್",
						category: "Operational",
						skill_level: "Level 2"
					}, {
						id: "skl-002",
						name_en: "Customer Interaction & Mobile App Literacy",
						name_kn: "ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ",
						category: "Service",
						skill_level: "Level 2"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-002"],
						overlap_skills: [{
							id: "skl-002",
							name_en: "Customer Interaction & Mobile App Literacy",
							name_kn: "ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ",
							category: "Service",
							skill_level: "Level 2"
						}],
						target_skill_ids: ["skl-004", "skl-005"],
						target_skills: [{
							id: "skl-004",
							name_en: "Electrician (Domestic / Installation)",
							name_kn: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)",
							category: "Technical Trades",
							skill_level: "Level 3"
						}, {
							id: "skl-005",
							name_en: "Basic Electrical Safety & Hand Tools",
							name_kn: "ಮೂಲ ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣಗಳ ಬಳಕೆ",
							category: "Foundational Technical",
							skill_level: "Level 2"
						}],
						overlap_count: 1,
						total_target_skills: 2,
						overlap_percentage: 50
					},
					skill_gaps: [{
						skill_id: "skl-004",
						skill_name: "Domestic Wiring & Circuit Installation",
						skill_category: "Technical Trades",
						gap_type: "target",
						rationale: "Required for certified wireman license and residential installation work.",
						has_it: false,
						how_to_close: "Complete Domestic Solutions Electrician Course (crs-002)"
					}, {
						skill_id: "skl-005",
						skill_name: "Electrical Safety & PPE Compliance",
						skill_category: "Foundational Technical",
						gap_type: "bridge",
						rationale: "Prerequisite safety training for live wire diagnostics.",
						has_it: false,
						how_to_close: "Safety module included in CMKKY induction"
					}],
					bridge_skills: [{
						id: "skl-005",
						name_en: "Basic Electrical Safety & Hand Tools",
						name_kn: "ಮೂಲ ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣಗಳ ಬಳಕೆ",
						category: "Foundational Technical",
						skill_level: "Level 2"
					}],
					courses: [{
						id: "crs-002",
						title: "Domestic Solutions Electrician (NSQF Level 3)",
						skill_id: "skl-004",
						level: "NSQF Level 3",
						duration_value: 350,
						duration_unit: "hours",
						mode: "offline",
						is_government_recognized: true,
						certifying_body: "NCVT / Directorate General of Training (DGT)",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-001",
						provider: "Government Industrial Training Institute (ITI) Bengaluru"
					}],
					nearby_centres: [{
						id: "tc-001",
						name: "Government Industrial Training Institute (ITI) Bengaluru Urban",
						district: "Bengaluru Urban",
						taluk: "Bengaluru North",
						address: "Dairy Circle, Bannerghatta Road, Bengaluru, Karnataka 560029",
						latitude: 12.9345,
						longitude: 77.5982,
						recognition_status: "govt-recognized",
						contact_phone: "+91 80 2225 1234",
						distance_km: 4.2,
						distance_type: "exact"
					}],
					scheme: {
						id: "sch-001",
						name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
						name_kn: "ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ",
						name_hi: "मुख्यमंत्री कौशल्य कर्नाटक योजना",
						issuing_authority: "Karnataka Skill Development Corporation (KSDC)",
						scheme_type: "State Vocational Training Subsidy",
						benefit_summary: "100% free technical skill training, assessment, and NCVT certification with travel allowance support.",
						official_url: "https://kaushalkar.karnataka.gov.in",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-001",
						scheme_name: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
						verdict: "eligible",
						reasons: [
							{
								rule_id: "rule-01",
								description: "Resident of Karnataka (Bengaluru Urban profile match)",
								passed: true,
								result: "pass",
								detail: "Bengaluru Urban resident"
							},
							{
								rule_id: "rule-02",
								description: "Age between 18 and 35 years (Age 26 meets criteria)",
								passed: true,
								result: "pass",
								detail: "Age 26"
							},
							{
								rule_id: "rule-03",
								description: "Minimum educational qualification 10th pass satisfied",
								passed: true,
								result: "pass",
								detail: "10th Pass"
							}
						],
						disclaimer: "Official document verification required at enrolment centre."
					},
					certification_status: "Government Recognized — NCVT / DGT Level 3",
					wage_lift: {
						current: {
							occupation: "Delivery / Courier Rider",
							monthly_wage_inr: 18e3,
							status: "benchmark"
						},
						target: {
							occupation: "Electrician (Domestic / Installation)",
							monthly_wage_inr: 3e4,
							status: "benchmark"
						},
						current_benchmark: {
							benchmark_id: "bmk-gig-01",
							occupation_name: "Delivery / Courier Rider",
							employment_type: "Gig / Platform Worker",
							wage_type: "earning",
							monthly_median_inr: 18e3,
							currency: "INR",
							geography_level: "District",
							district: "Bengaluru Urban",
							source_id: "src-mock-01",
							source_title: "Karnataka Gig Worker Survey 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						target_benchmark: {
							benchmark_id: "bmk-elec-01",
							occupation_name: "Electrician (Domestic / Installation)",
							employment_type: "Skilled Tradesperson",
							wage_type: "salary",
							monthly_median_inr: 3e4,
							currency: "INR",
							geography_level: "District",
							district: "Bengaluru Urban",
							source_id: "src-mock-01",
							source_title: "Karnataka Skill Council Benchmark 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						absolute_lift_inr: 12e3,
						percentage_lift: 66.7,
						absolute_difference_inr: 12e3,
						percentage_difference: 66.7,
						available: true,
						data_status: "mock",
						source_label: "Karnataka State Wage Survey & Industry Benchmarks 2024 (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 82,
						label: "Strong",
						overlap_component: 20,
						gap_component: 20,
						transition_component: 22,
						training_component: 10,
						centre_component: 10,
						explanation: "High urban demand for domestic electrical repairs in Bengaluru; strong synergy with route navigation and customer visit workflows."
					},
					rationale: "High urban demand for domestic electrical repairs; your mobile navigation and customer handling transfer well into on-site service visits; foundational safety training enables swift entry.",
					market_demand_note: "High demand across residential complexes and smart city electrification in Bengaluru Urban.",
					next_action: "Enroll in the 350-hour Domestic Solutions Electrician course at Government ITI Bengaluru (Majestic) under the free CMKKY scheme."
				}, {
					transition_id: "trans-001-alt",
					pathway_type: "bridge",
					confidence: "data-driven",
					confidence_note: "Clean-energy alternative pathway with booming solar rooftop installations across Karnataka.",
					current_occupation: {
						id: "occ-001",
						name_en: "Delivery / Courier Rider",
						name_kn: "ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್",
						name_hi: "डिलीवरी / कूरियर राइडर",
						sector: "Logistics & Gig Economy",
						nco_code: "8322.0401",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-011",
						name_en: "Solar PV Rooftop Technician",
						name_kn: "ಸೌರ ಫಲಕ ಅಳವಡಿಕೆ ತಂತ್ರಜ್ಞ",
						sector: "Renewable Energy",
						nco_code: "7421.0300"
					},
					target_skill: {
						id: "skl-006",
						name_en: "Solar Rooftop Installation & Inverter Wiring",
						category: "Renewable Energy",
						skill_level: "Level 3"
					},
					current_skills: [{
						id: "skl-001",
						name_en: "Two-Wheeler Driving & Route Navigation",
						category: "Operational",
						skill_level: "Level 2"
					}, {
						id: "skl-002",
						name_en: "Customer Interaction & Mobile App Literacy",
						category: "Service",
						skill_level: "Level 2"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-001"],
						overlap_skills: [{
							id: "skl-001",
							name_en: "Two-Wheeler Driving & Route Navigation",
							category: "Operational",
							skill_level: "Level 2"
						}],
						target_skill_ids: ["skl-006", "skl-005"],
						target_skills: [{
							id: "skl-006",
							name_en: "Solar Rooftop Installation & Inverter Wiring",
							category: "Renewable Energy",
							skill_level: "Level 3"
						}, {
							id: "skl-005",
							name_en: "Basic Electrical Safety & Hand Tools",
							category: "Foundational Technical",
							skill_level: "Level 2"
						}],
						overlap_count: 1,
						total_target_skills: 2,
						overlap_percentage: 50
					},
					skill_gaps: [{
						skill_id: "skl-006",
						skill_name: "Photovoltaic Array Alignment & Inverter Safety",
						skill_category: "Renewable Energy",
						gap_type: "target",
						rationale: "Required for grid-tied rooftop solar panel assembly and DC cabling.",
						has_it: false,
						how_to_close: "Complete Suryamitra Solar PV Technician module"
					}],
					bridge_skills: [{
						id: "skl-005",
						name_en: "Basic Electrical Safety & Hand Tools",
						category: "Foundational Technical",
						skill_level: "Level 2"
					}],
					courses: [{
						id: "crs-002-alt",
						title: "Suryamitra Solar PV Technician (NSQF Level 4)",
						skill_id: "skl-006",
						level: "NSQF Level 4",
						duration_value: 300,
						duration_unit: "hours",
						mode: "offline",
						is_government_recognized: true,
						certifying_body: "Skill Council for Green Jobs (SCGJ)",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-001",
						provider: "National Institute of Solar Energy / KREDL"
					}],
					nearby_centres: [{
						id: "tc-001",
						name: "Government Industrial Training Institute (ITI) Bengaluru Urban",
						district: "Bengaluru Urban",
						taluk: "Bengaluru North",
						address: "Dairy Circle, Bannerghatta Road, Bengaluru, Karnataka 560029",
						distance_km: 4.2,
						distance_type: "exact"
					}],
					scheme: {
						id: "sch-001",
						name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
						issuing_authority: "Karnataka Skill Development Corporation (KSDC)",
						scheme_type: "Renewable Skilling Initiative",
						benefit_summary: "100% free green skill training with solar industry placement drive.",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-001",
						scheme_name: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
						verdict: "eligible",
						reasons: [{
							rule_id: "rule-01",
							description: "Resident of Karnataka",
							passed: true,
							result: "pass"
						}]
					},
					certification_status: "Government Recognized — MNRE Suryamitra / NCVT",
					wage_lift: {
						current: {
							occupation: "Delivery / Courier Rider",
							monthly_wage_inr: 18e3,
							status: "benchmark"
						},
						target: {
							occupation: "Solar PV Rooftop Technician",
							monthly_wage_inr: 28e3,
							status: "benchmark"
						},
						current_benchmark: {
							benchmark_id: "bmk-gig-01",
							occupation_name: "Delivery / Courier Rider",
							employment_type: "Gig Worker",
							wage_type: "earning",
							monthly_median_inr: 18e3,
							currency: "INR",
							geography_level: "District",
							source_id: "src-mock-01",
							source_title: "Karnataka Gig Worker Survey 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						target_benchmark: {
							benchmark_id: "bmk-solar-01",
							occupation_name: "Solar PV Rooftop Technician",
							employment_type: "Clean Tech Installer",
							wage_type: "salary",
							monthly_median_inr: 28e3,
							currency: "INR",
							geography_level: "District",
							source_id: "src-mock-01",
							source_title: "Karnataka Clean Tech Wage Survey 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						absolute_lift_inr: 1e4,
						percentage_lift: 55.6,
						absolute_difference_inr: 1e4,
						percentage_difference: 55.6,
						available: true,
						data_status: "mock",
						source_label: "Karnataka Renewable Energy Sector Benchmark (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 75,
						label: "Good",
						overlap_component: 18,
						gap_component: 18,
						transition_component: 19,
						training_component: 10,
						centre_component: 10,
						explanation: "Accelerating installations under PM Surya Ghar Muft Bijli Yojana in Karnataka urban areas."
					},
					rationale: "Rapid expansion of PM Surya Ghar rooftop solar creates strong demand for field technicians with reliable mobility.",
					market_demand_note: "Accelerating installations across Karnataka under PM Surya Ghar Muft Bijli Yojana.",
					next_action: "Register for the Suryamitra Solar PV Technician program at KREDL-empanelled centres in Bengaluru."
				}]
			}
		}
	},
	{
		id: "domestic-worker-to-tailoring",
		name: "Domestic Worker → Tailoring",
		badge: "Household to Apparel",
		description: "Transition from domestic household work to self-employed tailoring and garment manufacturing in Mysuru.",
		initialProfile: {
			occupation: "Domestic Worker",
			district: "Mysuru",
			education: "Below 10th",
			career_goal_text: "I want to start my own tailoring work from home",
			language: "kn",
			age: 32,
			gender: "Female",
			pincode: "570001",
			latitude: null,
			longitude: null,
			session_id: "demo-sess-002"
		},
		response: {
			profile: {
				occupation: "Domestic Worker",
				district: "Mysuru",
				education: "Below 10th",
				career_goal_text: "I want to start my own tailoring work from home",
				language: "kn",
				age: 32,
				gender: "Female",
				pincode: "570001",
				latitude: null,
				longitude: null,
				session_id: "demo-sess-002"
			},
			matched_occupation: {
				id: "occ-002",
				name_en: "Domestic Worker / Household Assistant",
				name_kn: "ಮನೆಗೆಲಸದ ಸಹಾಯಕರು",
				name_hi: "घरेलू सहायिका",
				sector: "Domestic Services",
				nco_code: "9111.0100",
				is_informal_sector: true,
				description: "Informal household cleaning, meal preparation, and family support."
			},
			current_skills: [{
				id: "skl-010",
				name_en: "Time Management & Domestic Organization",
				name_kn: "ಸಮಯ ನಿರ್ವಹಣೆ ಮತ್ತು ಮನೆ ಕೆಲಸ",
				category: "Operational",
				skill_level: "Level 1"
			}, {
				id: "skl-011",
				name_en: "Fabric Care & Garment Handling",
				name_kn: "ಬಟ್ಟೆಗಳ ನಿರ್ವಹಣೆ ಮತ್ತು ಸ್ವಚ್ಛತೆ",
				category: "Service",
				skill_level: "Level 1"
			}],
			recommended_pathways: [{
				target_skill: {
					id: "skl-012",
					name_en: "Self Employed Tailor",
					name_kn: "ಸ್ವಯಂ ಉದ್ಯೋಗಿ ದರ್ಜಿ",
					name_hi: "स्व-नियोजित दर्जी",
					category: "Apparel & Garment",
					skill_level: "Level 3"
				},
				bridge_skills: [{
					id: "skl-013",
					name_en: "Pattern Cutting & Sewing Machine Operation",
					name_kn: "ಪ್ಯಾಟರ್ನ್ ಕಟಿಂಗ್ ಮತ್ತು ಹೊಲಿಗೆ ಯಂತ್ರ ಬಳಕೆ",
					category: "Technical",
					skill_level: "Level 2"
				}],
				rationale: "Direct pathway to home-based income generation and flexibility; your fabric handling experience directly prepares you for machine stitching and pattern measurement.",
				confidence: "expert-curated",
				courses: [{
					id: "crs-001",
					title: "Self Employed Tailor (AMH/Q1947)",
					skill_id: "skl-012",
					level: "NSQF Level 3",
					duration_value: 240,
					duration_unit: "hours",
					mode: "offline",
					is_government_recognized: true,
					certifying_body: "Apparel Made-Ups & Home Furnishing Sector Skill Council",
					fee_type: "free",
					fee_amount_inr: 0,
					source_id: "src-011",
					provider: "Karnataka German Technical Training Institute (KGTTI) / KSDC"
				}],
				centres: [{
					id: "tc-015",
					name: "Government ITI for Women, Mysuru",
					district: "Mysuru",
					taluk: "Mysuru City",
					address: "Near Suburb Bus Stand, Mysuru, Karnataka 570001",
					latitude: 12.3082,
					longitude: 76.6575,
					recognition_status: "govt-recognized",
					contact_phone: "+91 821 244 5560",
					distance_km: 2.1,
					distance_type: "exact"
				}]
			}],
			skill_gaps: [{
				skill_id: "skl-012",
				skill_name: "Machine Sewing & Garment Stitching",
				skill_category: "Apparel",
				gap_type: "target",
				rationale: "Required for standard garment measurements, blouse cutting, and seam finishing.",
				has_it: false,
				how_to_close: "Enroll in Self Employed Tailor certification course (crs-001)"
			}],
			courses: [{
				id: "crs-001",
				title: "Self Employed Tailor (AMH/Q1947)",
				skill_id: "skl-012",
				level: "NSQF Level 3",
				duration_value: 240,
				duration_unit: "hours",
				mode: "offline",
				is_government_recognized: true,
				certifying_body: "Apparel Sector Skill Council (AMHSSC)",
				fee_type: "free",
				fee_amount_inr: 0,
				source_id: "src-011",
				provider: "KGTTI & KSDC Mysuru"
			}],
			nearby_centres: [{
				id: "tc-015",
				name: "Government ITI for Women, Mysuru",
				district: "Mysuru",
				taluk: "Mysuru City",
				address: "Near Suburb Bus Stand, Mysuru, Karnataka 570001",
				latitude: 12.3082,
				longitude: 76.6575,
				recognition_status: "govt-recognized",
				contact_phone: "+91 821 244 5560",
				distance_km: 2.1,
				distance_type: "exact"
			}],
			schemes: [{
				id: "sch-005",
				name_en: "PM Vishwakarma Scheme (Darzi / Tailor Trade)",
				name_kn: "ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಯೋಜನೆ (ದರ್ಜಿ ಕಲೆ)",
				name_hi: "पीएम विश्वकर्मा योजना (दर्जी)",
				issuing_authority: "Ministry of Micro, Small and Medium Enterprises (MSME)",
				scheme_type: "Artisan Toolkit & Credit Support",
				benefit_summary: "PM Vishwakarma Certificate, ID Card, basic skill training with ₹500/day stipend, and ₹15,000 modern toolkit grant.",
				official_url: "https://pmvishwakarma.gov.in",
				status: "active"
			}],
			eligibility: [{
				scheme_id: "sch-005",
				scheme_name: "PM Vishwakarma (Tailor / Darzi)",
				verdict: "eligible",
				reasons: [{
					rule_id: "rule-vis-01",
					field_path: "profile.occupation",
					human_readable_condition: "Traditional artisan or trade worker in designated list (Darzi)",
					result: "pass"
				}, {
					rule_id: "rule-vis-02",
					field_path: "profile.age",
					human_readable_condition: "Minimum 18 years of age (Age 32)",
					result: "pass"
				}],
				required_documents: [{
					document_id: "doc-001",
					document_name: "Aadhaar Card linked with mobile number",
					mandatory: true
				}, {
					document_id: "doc-004",
					document_name: "Ration Card / Domicile Certificate",
					mandatory: true
				}]
			}],
			documents: [{
				document_id: "doc-001",
				document_name: "Aadhaar Card",
				mandatory: true
			}],
			evidence_count: 2,
			warnings: [],
			explanation: {
				summary: "Your domestic fabric handling skills provide a solid foundation for independent tailoring in Mysuru. Training at the Government Women ITI equips you with machine cutting and garment assembly.",
				skill_gap_explanation: "Focused training is required on motorized sewing machine operation and standardized pattern drafting.",
				pathway_explanation: "Self-employed tailoring allows flexible home-based entrepreneurship or micro-boutique operations in Mysuru with government toolkit support.",
				next_steps: [
					"Visit nearest Grama One or Karnataka One centre to register for PM Vishwakarma under the Tailor (Darzi) trade.",
					"Register for the free Self Employed Tailor course at Government ITI for Women in Mysuru.",
					"Complete the basic 5-7 day skill training to receive the ₹15,000 digital toolkit voucher."
				],
				limitations: ["Toolkit vouchers are disbursed only after successful skill assessment by the Sector Skill Council."]
			},
			validated_evidence: [{
				chunk_id: "chk-002",
				source_id: "src-001",
				authority: "Ministry of MSME, Government of India",
				excerpt: "PM Vishwakarma Scheme provides holistic end-to-end support to traditional artisans and craftspeople including Darzi (Tailor).",
				page_or_section: "Scheme Guidelines 2023",
				source_url: "https://pmvishwakarma.gov.in"
			}],
			explanation_status: "available",
			evidence_status: "retrieved",
			skill_bridge: {
				current_occupation: {
					id: "occ-002",
					name_en: "Domestic Worker / Household Assistant",
					name_kn: "ಮನೆಗೆಲಸದ ಸಹಾಯಕರು",
					name_hi: "घरेलू सहायिका",
					sector: "Domestic Services",
					nco_code: "9111.0100",
					is_informal_sector: true,
					description: "Informal household cleaning, meal preparation, and family support."
				},
				current_skills: [{
					id: "skl-010",
					name_en: "Time Management & Domestic Organization",
					name_kn: "ಸಮಯ ನಿರ್ವಹಣೆ ಮತ್ತು ಮನೆ ಕೆಲಸ",
					category: "Operational",
					skill_level: "Level 1"
				}, {
					id: "skl-011",
					name_en: "Fabric Care & Garment Handling",
					name_kn: "ಬಟ್ಟೆಗಳ ನಿರ್ವಹಣೆ ಮತ್ತು ಸ್ವಚ್ಛತೆ",
					category: "Service",
					skill_level: "Level 1"
				}],
				warnings: [],
				pathways: [{
					transition_id: "trans-002-primary",
					pathway_type: "direct",
					confidence: "expert-curated",
					confidence_note: "Natural skill progression from garment care into motorized tailoring; supported by PM Vishwakarma toolkit voucher.",
					current_occupation: {
						id: "occ-002",
						name_en: "Domestic Worker / Household Assistant",
						name_kn: "ಮನೆಗೆಲಸದ ಸಹಾಯಕರು",
						name_hi: "घरेलू सहायिका",
						sector: "Domestic Services",
						nco_code: "9111.0100",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-020",
						name_en: "Self Employed Tailor",
						name_kn: "ಸ್ವಯಂ ಉದ್ಯೋಗಿ ದರ್ಜಿ",
						name_hi: "स्व-नियोजित दर्जी",
						sector: "Apparel & Garment Manufacturing",
						nco_code: "7531.0100",
						is_informal_sector: true,
						description: "Independent tailoring, stitching, alterations, and garment entrepreneurship."
					},
					target_skill: {
						id: "skl-012",
						name_en: "Self Employed Tailor",
						name_kn: "ಸ್ವಯಂ ಉದ್ಯೋಗಿ ದರ್ಜಿ",
						name_hi: "स्व-नियोजित दर्जी",
						category: "Apparel & Garment",
						skill_level: "Level 3",
						is_certifiable: true,
						certifying_body: "Apparel Made-Ups & Home Furnishing SSC (AMHSSC)"
					},
					current_skills: [{
						id: "skl-010",
						name_en: "Time Management & Domestic Organization",
						category: "Operational",
						skill_level: "Level 1"
					}, {
						id: "skl-011",
						name_en: "Fabric Care & Garment Handling",
						category: "Service",
						skill_level: "Level 1"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-011"],
						overlap_skills: [{
							id: "skl-011",
							name_en: "Fabric Care & Garment Handling",
							category: "Service",
							skill_level: "Level 1"
						}],
						target_skill_ids: ["skl-012", "skl-013"],
						target_skills: [{
							id: "skl-012",
							name_en: "Self Employed Tailor",
							category: "Apparel & Garment",
							skill_level: "Level 3"
						}, {
							id: "skl-013",
							name_en: "Pattern Cutting & Sewing Machine Operation",
							category: "Technical",
							skill_level: "Level 2"
						}],
						overlap_count: 1,
						total_target_skills: 2,
						overlap_percentage: 50
					},
					skill_gaps: [{
						skill_id: "skl-012",
						skill_name: "Motorized Sewing Machine Operation & Stitching",
						skill_category: "Tailoring",
						gap_type: "target",
						rationale: "Required for commercial garment stitching and customer alterations.",
						has_it: false,
						how_to_close: "Complete Self Employed Tailor Course at Govt ITI Women Mysuru"
					}],
					bridge_skills: [{
						id: "skl-013",
						name_en: "Pattern Cutting & Sewing Machine Operation",
						name_kn: "ಮಾದರಿ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಯಂತ್ರ ಬಳಕೆ",
						category: "Technical",
						skill_level: "Level 2"
					}],
					courses: [{
						id: "crs-003",
						title: "Self Employed Tailor (AMH/Q1947)",
						skill_id: "skl-012",
						level: "NSQF Level 3",
						duration_value: 340,
						duration_unit: "hours",
						mode: "offline",
						is_government_recognized: true,
						certifying_body: "Apparel Made-Ups & Home Furnishing Sector Skill Council",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-001",
						provider: "Government ITI for Women Mysuru"
					}],
					nearby_centres: [{
						id: "tc-020",
						name: "Government Industrial Training Institute (ITI) for Women Mysuru",
						district: "Mysuru",
						taluk: "Mysuru Urban",
						address: "Nazarbad Main Road, Mysuru, Karnataka 570010",
						latitude: 12.3082,
						longitude: 76.6657,
						recognition_status: "govt-recognized",
						contact_phone: "+91 821 244 5678",
						distance_km: 2.3,
						distance_type: "exact"
					}],
					scheme: {
						id: "sch-003",
						name_en: "PM Vishwakarma Scheme (Darzi / Tailor Trade)",
						name_kn: "ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಯೋಜನೆ (ದರ್ಜಿ)",
						name_hi: "पीएम विश्वकर्मा योजना (दर्जी)",
						issuing_authority: "Ministry of MSME, Government of India",
						scheme_type: "Central Artisan & Micro-Enterprise Welfare",
						benefit_summary: "Free 5-7 days skill verification training with ₹500/day stipend, ₹15,000 digital toolkit voucher, and collateral-free enterprise loan up to ₹1 Lakh at 5% interest.",
						official_url: "https://pmvishwakarma.gov.in",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-003",
						scheme_name: "PM Vishwakarma Scheme (Darzi / Tailor)",
						verdict: "eligible",
						reasons: [
							{
								rule_id: "rule-vis-01",
								description: "Traditional artisanal or hands-on trade engagement (Age 32, Female profile match)",
								passed: true,
								result: "pass",
								detail: "Artisan trade match"
							},
							{
								rule_id: "rule-vis-02",
								description: "Age above 18 years satisfied",
								passed: true,
								result: "pass",
								detail: "Age 32"
							},
							{
								rule_id: "rule-vis-03",
								description: "No prior PMEGP/Mudra formal default registered",
								passed: true,
								result: "pass"
							}
						],
						disclaimer: "Grama One / Karnataka One biometrics required for onboarding."
					},
					certification_status: "Government Recognized — PM Vishwakarma / NCVT",
					wage_lift: {
						current: {
							occupation: "Domestic Worker",
							monthly_wage_inr: 8e3,
							status: "benchmark"
						},
						target: {
							occupation: "Self Employed Tailor",
							monthly_wage_inr: 16e3,
							status: "benchmark"
						},
						current_benchmark: {
							benchmark_id: "bmk-dom-01",
							occupation_name: "Domestic Worker",
							employment_type: "Informal Household Worker",
							wage_type: "earning",
							monthly_median_inr: 8e3,
							currency: "INR",
							geography_level: "District",
							district: "Mysuru",
							source_id: "src-mock-02",
							source_title: "Karnataka Unorganised Labour Survey 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						target_benchmark: {
							benchmark_id: "bmk-tailor-01",
							occupation_name: "Self Employed Tailor",
							employment_type: "Self Employed",
							wage_type: "earning",
							monthly_median_inr: 16e3,
							currency: "INR",
							geography_level: "District",
							district: "Mysuru",
							source_id: "src-mock-02",
							source_title: "Karnataka Apparel Sector Benchmark 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						absolute_lift_inr: 8e3,
						percentage_lift: 100,
						absolute_difference_inr: 8e3,
						percentage_difference: 100,
						available: true,
						data_status: "mock",
						source_label: "Karnataka Garment Sector Benchmark (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 85,
						label: "Strong",
						overlap_component: 22,
						gap_component: 20,
						transition_component: 23,
						training_component: 10,
						centre_component: 10,
						explanation: "Direct transfer of fabric handling into commercial tailoring; ₹15,000 PM Vishwakarma toolkit eliminates upfront capital barriers."
					},
					rationale: "Familiarity with fabrics, laundering, and household garments provides practical foundation for professional tailoring and home-based garment alterations.",
					market_demand_note: "High demand for custom alterations and festive garments in residential Mysuru neighborhoods.",
					next_action: "Visit nearest Grama One or Karnataka One centre in Mysuru to register for PM Vishwakarma under the Tailor trade and claim your ₹15,000 toolkit voucher."
				}, {
					transition_id: "trans-002-alt",
					pathway_type: "bridge",
					confidence: "expert-curated",
					confidence_note: "Care-economy transition with high institutional hiring demand in hospitals and elder care homes.",
					current_occupation: {
						id: "occ-002",
						name_en: "Domestic Worker",
						sector: "Domestic Services",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-021",
						name_en: "General Duty Healthcare Assistant",
						name_kn: "ಸಾಮಾನ್ಯ ಕರ್ತವ್ಯ ಆರೋಗ್ಯ ಸಹಾಯಕರು",
						sector: "Healthcare & Life Sciences",
						nco_code: "5321.0100"
					},
					target_skill: {
						id: "skl-015",
						name_en: "Patient Hygiene & Vital Signs Monitoring",
						category: "Healthcare",
						skill_level: "Level 3"
					},
					current_skills: [{
						id: "skl-010",
						name_en: "Time Management & Domestic Organization",
						category: "Operational",
						skill_level: "Level 1"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-010"],
						overlap_skills: [{
							id: "skl-010",
							name_en: "Time Management & Domestic Organization",
							category: "Operational",
							skill_level: "Level 1"
						}],
						target_skill_ids: ["skl-015"],
						target_skills: [{
							id: "skl-015",
							name_en: "Patient Hygiene & Vital Signs Monitoring",
							category: "Healthcare",
							skill_level: "Level 3"
						}],
						overlap_count: 1,
						total_target_skills: 1,
						overlap_percentage: 100
					},
					skill_gaps: [{
						skill_id: "skl-015",
						skill_name: "Patient Vital Signs Recording & Infection Control",
						skill_category: "Healthcare",
						gap_type: "target",
						rationale: "Clinical protocols for patient care and sanitization.",
						has_it: false,
						how_to_close: "Complete General Duty Assistant Course (HSS/Q5101)"
					}],
					bridge_skills: [],
					courses: [{
						id: "crs-004",
						title: "General Duty Assistant (NSQF Level 3)",
						skill_id: "skl-015",
						level: "NSQF Level 3",
						duration_value: 360,
						duration_unit: "hours",
						mode: "offline",
						is_government_recognized: true,
						certifying_body: "Healthcare Sector Skill Council",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-001",
						provider: "Mysuru District Hospital Skill Centre"
					}],
					nearby_centres: [{
						id: "tc-020",
						name: "Government ITI for Women Mysuru",
						district: "Mysuru",
						distance_km: 2.3
					}],
					scheme: {
						id: "sch-001",
						name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
						issuing_authority: "Karnataka Skill Development Corporation",
						scheme_type: "Healthcare Skilling Grant",
						benefit_summary: "Free healthcare training and government hospital internship stipend.",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-001",
						scheme_name: "CMKKY Healthcare Grant",
						verdict: "eligible",
						reasons: [{
							rule_id: "rule-01",
							description: "Resident of Karnataka",
							passed: true,
							result: "pass"
						}]
					},
					certification_status: "Government Recognized — HSSC NSQF Level 3",
					wage_lift: {
						current: {
							occupation: "Domestic Worker",
							monthly_wage_inr: 8e3,
							status: "benchmark"
						},
						target: {
							occupation: "General Duty Healthcare Assistant",
							monthly_wage_inr: 18e3,
							status: "benchmark"
						},
						absolute_lift_inr: 1e4,
						percentage_lift: 125,
						absolute_difference_inr: 1e4,
						percentage_difference: 125,
						available: true,
						data_status: "mock",
						source_label: "Karnataka Healthcare Sector Survey 2024 (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 73,
						label: "Good",
						overlap_component: 16,
						gap_component: 18,
						transition_component: 19,
						training_component: 10,
						centre_component: 10,
						explanation: "Steady formal healthcare payroll with Provident Fund and hospital shift allowances."
					},
					rationale: "Domestic care experience translates into clinical assistant roles with predictable shifts and healthcare benefits.",
					market_demand_note: "Expanding private nursing homes and assisted elder care in Mysuru.",
					next_action: "Explore the 360-hour Healthcare General Duty Assistant module at Mysuru District Hospital Skill Centre."
				}]
			}
		}
	},
	{
		id: "construction-to-fitter",
		name: "Construction Labourer → Fitter",
		badge: "Construction to Industrial",
		description: "Transition from manual construction labor to certified industrial mechanical fitter in Belagavi.",
		initialProfile: {
			occupation: "Construction Labourer",
			district: "Belagavi",
			education: "No Formal Education",
			career_goal_text: "I want to learn machine fitting and factory technical work",
			language: "hi",
			age: 28,
			gender: "Male",
			pincode: "590001",
			latitude: null,
			longitude: null,
			session_id: "demo-sess-003"
		},
		response: {
			profile: {
				occupation: "Construction Labourer",
				district: "Belagavi",
				education: "No Formal Education",
				career_goal_text: "I want to learn machine fitting and factory technical work",
				language: "hi",
				age: 28,
				gender: "Male",
				pincode: "590001",
				latitude: null,
				longitude: null,
				session_id: "demo-sess-003"
			},
			matched_occupation: {
				id: "occ-003",
				name_en: "Construction Labourer / Helper",
				name_kn: "ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ",
				name_hi: "निर्माण श्रमिक",
				sector: "Construction & Real Estate",
				nco_code: "9312.0100",
				is_informal_sector: true,
				description: "Manual material handling, site excavation, and masonry assistance."
			},
			current_skills: [{
				id: "skl-020",
				name_en: "Heavy Material Handling & Physical Stamina",
				name_kn: "ಭಾರವಾದ ವಸ್ತುಗಳ ನಿರ್ವಹಣೆ",
				category: "Physical",
				skill_level: "Level 1"
			}, {
				id: "skl-021",
				name_en: "Basic Site Safety & Tool Usage",
				name_kn: "ಮೂಲ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣ ಬಳಕೆ",
				category: "Operational",
				skill_level: "Level 1"
			}],
			recommended_pathways: [{
				target_skill: {
					id: "skl-022",
					name_en: "Mechanical Fitter / Assembly Technician",
					name_kn: "ಮೆಕ್ಯಾನಿಕಲ್ ಫಿಟ್ಟರ್",
					name_hi: "मैकेनिकल फिटर",
					category: "Manufacturing & Engineering",
					skill_level: "Level 3"
				},
				bridge_skills: [{
					id: "skl-023",
					name_en: "Precision Measurement & Bench Work",
					name_kn: "ನಿಖರ ಅಳತೆ ಮತ್ತು ಬೆಂಚ್ ಕೆಲಸ",
					category: "Technical",
					skill_level: "Level 2"
				}],
				rationale: "Industrial machine manufacturing in Belagavi demands mechanical fitters; your heavy tool handling and stamina translate into industrial machinery assembly.",
				confidence: "data-driven",
				courses: [{
					id: "crs-005",
					title: "Industrial Mechanical Fitter (NSQF Level 3)",
					skill_id: "skl-022",
					level: "NSQF Level 3",
					duration_value: 300,
					duration_unit: "hours",
					mode: "offline",
					is_government_recognized: true,
					certifying_body: "Directorate General of Training (DGT)",
					fee_type: "free",
					fee_amount_inr: 0,
					source_id: "src-018",
					provider: "Government ITI Belagavi"
				}],
				centres: [{
					id: "tc-040",
					name: "Government Industrial Training Institute (ITI) Belagavi",
					district: "Belagavi",
					taluk: "Belagavi",
					address: "Majagaon Road, Udyambag, Belagavi, Karnataka 590008",
					latitude: 15.8234,
					longitude: 74.5021,
					recognition_status: "govt-recognized",
					contact_phone: "+91 831 244 1230",
					distance_km: 3.6,
					distance_type: "exact"
				}]
			}],
			skill_gaps: [{
				skill_id: "skl-022",
				skill_name: "Precision Metal Filing & Component Assembly",
				skill_category: "Manufacturing",
				gap_type: "target",
				rationale: "Technical requirement to interpret component drawings and use vernier calipers.",
				has_it: false,
				how_to_close: "Complete Industrial Mechanical Fitter Course (crs-005)"
			}],
			courses: [{
				id: "crs-005",
				title: "Industrial Mechanical Fitter (NSQF Level 3)",
				skill_id: "skl-022",
				level: "NSQF Level 3",
				duration_value: 300,
				duration_unit: "hours",
				mode: "offline",
				is_government_recognized: true,
				certifying_body: "DGT / NCVT",
				fee_type: "free",
				fee_amount_inr: 0,
				source_id: "src-018",
				provider: "Government ITI Belagavi"
			}],
			nearby_centres: [{
				id: "tc-040",
				name: "Government Industrial Training Institute (ITI) Belagavi",
				district: "Belagavi",
				taluk: "Belagavi",
				address: "Majagaon Road, Udyambag, Belagavi, Karnataka 590008",
				latitude: 15.8234,
				longitude: 74.5021,
				recognition_status: "govt-recognized",
				contact_phone: "+91 831 244 1230",
				distance_km: 3.6,
				distance_type: "exact"
			}, {
				id: "tc-041",
				name: "Bailhongal Rural Skill Training Centre",
				district: "Belagavi",
				taluk: "Bailhongal",
				address: "Taluk Office Road, Bailhongal, Belagavi",
				latitude: null,
				longitude: null,
				recognition_status: "empanelled",
				distance_km: null,
				distance_type: "none"
			}],
			schemes: [{
				id: "sch-008",
				name_en: "Karnataka Building & Other Construction Workers Board (KBOCWWB)",
				name_kn: "ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಮತ್ತು ಇತರೆ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿ",
				name_hi: "कर्नाटक भवन एवं अन्य सन्निर्माण कर्मकार कल्याण बोर्ड",
				issuing_authority: "Labour Department, Government of Karnataka",
				scheme_type: "Welfare & Skill Upgrade Subsidy",
				benefit_summary: "Toolkits, skill upgradation stipends, accident cover, and scholarship assistance for registered construction workers.",
				official_url: "https://karbwwb.karnataka.gov.in",
				status: "active"
			}],
			eligibility: [{
				scheme_id: "sch-008",
				scheme_name: "KBOCWWB Welfare Benefits & Skill Training",
				verdict: "eligible",
				reasons: [{
					rule_id: "rule-kboc-01",
					field_path: "profile.occupation",
					human_readable_condition: "Engaged in building or construction work for at least 90 days",
					result: "pass"
				}],
				required_documents: [{
					document_id: "doc-010",
					document_name: "90-day Construction Work Certificate from Registered Contractor/Union",
					mandatory: true
				}, {
					document_id: "doc-001",
					document_name: "Aadhaar Card",
					mandatory: true
				}]
			}],
			documents: [{
				document_id: "doc-001",
				document_name: "Aadhaar Card",
				mandatory: true
			}],
			evidence_count: 2,
			warnings: [],
			explanation: {
				summary: "Transitioning from manual site labor to mechanical fitting provides permanent manufacturing employment in Belagavi’s Udyambag foundry and machine cluster.",
				skill_gap_explanation: "Moving to industrial fitting requires learning precision hand tools, metal grinding, and basic blueprint interpretation.",
				pathway_explanation: "Government ITI Belagavi offers subsidized practical training with heavy machinery and certified DGT curriculum.",
				next_steps: [
					"Verify your active membership with KBOCWWB or visit the District Labour Office in Belagavi.",
					"Enroll in the Industrial Mechanical Fitter batch at Govt ITI Udyambag.",
					"Utilize KBOCWWB training allowance during the 300-hour vocational course."
				],
				limitations: ["One centre in Bailhongal does not have verified GPS coordinates; distance calculation is unavailable for that location."]
			},
			validated_evidence: [{
				chunk_id: "chk-024",
				source_id: "src-007",
				authority: "Karnataka Building and Other Construction Workers Welfare Board",
				excerpt: "Registered construction workers are entitled to full skill development sponsorship and toolkits upon trade completion.",
				page_or_section: "KBOCWWB Welfare Schemes Act",
				source_url: "https://karbwwb.karnataka.gov.in"
			}],
			explanation_status: "available",
			evidence_status: "retrieved",
			skill_bridge: {
				current_occupation: {
					id: "occ-003",
					name_en: "Construction Labourer / Helper",
					name_kn: "ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ",
					name_hi: "निर्माण श्रमिक",
					sector: "Construction & Real Estate",
					nco_code: "9312.0100",
					is_informal_sector: true,
					description: "Manual material handling, site excavation, and masonry assistance."
				},
				current_skills: [{
					id: "skl-020",
					name_en: "Heavy Material Handling & Physical Stamina",
					name_kn: "ಭಾರವಾದ ವಸ್ತುಗಳ ನಿರ್ವಹಣೆ",
					category: "Physical",
					skill_level: "Level 1"
				}, {
					id: "skl-021",
					name_en: "Basic Site Safety & Tool Usage",
					name_kn: "ಮೂಲ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣ ಬಳಕೆ",
					category: "Operational",
					skill_level: "Level 1"
				}],
				warnings: [],
				pathways: [{
					transition_id: "trans-003-primary",
					pathway_type: "bridge",
					confidence: "data-driven",
					confidence_note: "High regional demand in Belagavi manufacturing cluster; physical strength and tool handling enable rapid qualification in mechanical fitting.",
					current_occupation: {
						id: "occ-003",
						name_en: "Construction Labourer / Helper",
						name_kn: "ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ",
						name_hi: "निर्माण श्रमिक",
						sector: "Construction & Real Estate",
						nco_code: "9312.0100",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-030",
						name_en: "Mechanical Fitter / Assembly Technician",
						name_kn: "ಮೆಕ್ಯಾನಿಕಲ್ ಫಿಟ್ಟರ್",
						name_hi: "मैकेनिकल फिटर",
						sector: "Manufacturing & Engineering",
						nco_code: "7214.0100",
						is_informal_sector: false,
						description: "Industrial machinery assembly, bench fitting, and component alignment."
					},
					target_skill: {
						id: "skl-022",
						name_en: "Mechanical Fitter / Assembly Technician",
						name_kn: "ಮೆಕ್ಯಾನಿಕಲ್ ಫಿಟ್ಟರ್",
						name_hi: "मैकेनिकल फिटर",
						category: "Manufacturing & Engineering",
						skill_level: "Level 3",
						is_certifiable: true,
						certifying_body: "DGT / NCVT"
					},
					current_skills: [{
						id: "skl-020",
						name_en: "Heavy Material Handling & Physical Stamina",
						category: "Physical",
						skill_level: "Level 1"
					}, {
						id: "skl-021",
						name_en: "Basic Site Safety & Tool Usage",
						category: "Operational",
						skill_level: "Level 1"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-021"],
						overlap_skills: [{
							id: "skl-021",
							name_en: "Basic Site Safety & Tool Usage",
							category: "Operational",
							skill_level: "Level 1"
						}],
						target_skill_ids: ["skl-022", "skl-023"],
						target_skills: [{
							id: "skl-022",
							name_en: "Mechanical Fitter / Assembly Technician",
							category: "Manufacturing & Engineering",
							skill_level: "Level 3"
						}, {
							id: "skl-023",
							name_en: "Precision Measurement & Bench Work",
							category: "Technical",
							skill_level: "Level 2"
						}],
						overlap_count: 1,
						total_target_skills: 2,
						overlap_percentage: 50
					},
					skill_gaps: [{
						skill_id: "skl-022",
						skill_name: "Precision Metal Filing & Component Assembly",
						skill_category: "Manufacturing",
						gap_type: "target",
						rationale: "Technical requirement to interpret component drawings and use vernier calipers.",
						has_it: false,
						how_to_close: "Complete Industrial Mechanical Fitter Course (crs-005)"
					}],
					bridge_skills: [{
						id: "skl-023",
						name_en: "Precision Measurement & Bench Work",
						name_kn: "ನಿಖರ ಅಳತೆ ಮತ್ತು ಬೆಂಚ್ ಕೆಲಸ",
						category: "Technical",
						skill_level: "Level 2"
					}],
					courses: [{
						id: "crs-005",
						title: "Industrial Mechanical Fitter (NSQF Level 3)",
						skill_id: "skl-022",
						level: "NSQF Level 3",
						duration_value: 300,
						duration_unit: "hours",
						mode: "offline",
						is_government_recognized: true,
						certifying_body: "Directorate General of Training (DGT)",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-018",
						provider: "Government ITI Belagavi"
					}],
					nearby_centres: [{
						id: "tc-040",
						name: "Government Industrial Training Institute (ITI) Belagavi",
						district: "Belagavi",
						taluk: "Belagavi",
						address: "Majagaon Road, Udyambag, Belagavi, Karnataka 590008",
						latitude: 15.8234,
						longitude: 74.5021,
						recognition_status: "govt-recognized",
						contact_phone: "+91 831 244 1230",
						distance_km: 3.6,
						distance_type: "exact"
					}],
					scheme: {
						id: "sch-008",
						name_en: "Karnataka Building & Other Construction Workers Board (KBOCWWB)",
						name_kn: "ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಮತ್ತು ಇತರೆ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿ",
						name_hi: "कर्नाटक भवन एवं अन्य सन्निर्माण कर्मकार कल्याण बोर्ड",
						issuing_authority: "Labour Department, Government of Karnataka",
						scheme_type: "Welfare & Skill Upgrade Subsidy",
						benefit_summary: "Toolkits, skill upgradation stipends, accident cover, and scholarship assistance for registered construction workers.",
						official_url: "https://karbwwb.karnataka.gov.in",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-008",
						scheme_name: "KBOCWWB Skill Upgrade Scheme",
						verdict: "eligible",
						reasons: [{
							rule_id: "rule-kbocw-01",
							description: "Engaged in manual/construction building labor in Karnataka",
							passed: true,
							result: "pass",
							detail: "Construction Labourer match"
						}, {
							rule_id: "rule-kbocw-02",
							description: "Age between 18 and 60 years satisfied (Age 28)",
							passed: true,
							result: "pass",
							detail: "Age 28"
						}]
					},
					certification_status: "Government Recognized — DGT / NCVT Level 3",
					wage_lift: {
						current: {
							occupation: "Construction Labourer",
							monthly_wage_inr: 12e3,
							status: "benchmark"
						},
						target: {
							occupation: "Mechanical Fitter",
							monthly_wage_inr: 29e3,
							status: "benchmark"
						},
						current_benchmark: {
							benchmark_id: "bmk-const-01",
							occupation_name: "Construction Labourer",
							employment_type: "Daily Wage Manual Worker",
							wage_type: "earning",
							monthly_median_inr: 12e3,
							currency: "INR",
							geography_level: "District",
							district: "Belagavi",
							source_id: "src-mock-03",
							source_title: "Karnataka Daily Wage Labour Survey 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						target_benchmark: {
							benchmark_id: "bmk-fitter-01",
							occupation_name: "Mechanical Fitter",
							employment_type: "Industrial Technician",
							wage_type: "salary",
							monthly_median_inr: 29e3,
							currency: "INR",
							geography_level: "District",
							district: "Belagavi",
							source_id: "src-mock-03",
							source_title: "Belagavi Industrial Hub Benchmark 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						absolute_lift_inr: 17e3,
						percentage_lift: 141.7,
						absolute_difference_inr: 17e3,
						percentage_difference: 141.7,
						available: true,
						data_status: "mock",
						source_label: "Belagavi Industrial Hub Benchmark (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 78,
						label: "Good",
						overlap_component: 18,
						gap_component: 18,
						transition_component: 22,
						training_component: 10,
						centre_component: 10,
						explanation: "Major engineering foundry cluster in Belagavi provides consistent demand and rapid industrial placement."
					},
					rationale: "Industrial machine manufacturing in Belagavi demands mechanical fitters; your heavy tool handling and stamina translate into industrial machinery assembly.",
					market_demand_note: "Over 200 automotive and hydraulic pump foundries in Belagavi actively hire certified fitters.",
					next_action: "Register at Government ITI Belagavi for the Industrial Mechanical Fitter batch under KBOCWWB skill upgradation scheme."
				}, {
					transition_id: "trans-003-alt",
					pathway_type: "bridge",
					confidence: "data-driven",
					confidence_note: "Foundational metal fabrication pathway with immediate industrial yard placement.",
					current_occupation: {
						id: "occ-003",
						name_en: "Construction Labourer",
						sector: "Construction",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-031",
						name_en: "Shielded Metal Arc Welder (SMAW)",
						name_kn: "ವೆಲ್ಡರ್",
						sector: "Fabrication & Welding",
						nco_code: "7212.0100"
					},
					target_skill: {
						id: "skl-025",
						name_en: "Arc & Gas Welding Technique",
						category: "Fabrication",
						skill_level: "Level 2"
					},
					current_skills: [{
						id: "skl-021",
						name_en: "Basic Site Safety & Tool Usage",
						category: "Operational",
						skill_level: "Level 1"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-021"],
						overlap_skills: [{
							id: "skl-021",
							name_en: "Basic Site Safety & Tool Usage",
							category: "Operational",
							skill_level: "Level 1"
						}],
						target_skill_ids: ["skl-025"],
						target_skills: [{
							id: "skl-025",
							name_en: "Arc & Gas Welding Technique",
							category: "Fabrication",
							skill_level: "Level 2"
						}],
						overlap_count: 1,
						total_target_skills: 1,
						overlap_percentage: 100
					},
					skill_gaps: [{
						skill_id: "skl-025",
						skill_name: "Shielded Arc Welding Position 1G/2G",
						skill_category: "Fabrication",
						gap_type: "target",
						rationale: "Standard structural welding safety and bead consistency.",
						has_it: false,
						how_to_close: "SMAW 200-hour module"
					}],
					bridge_skills: [],
					courses: [{
						id: "crs-006",
						title: "Shielded Metal Arc Welder (NSQF Level 2)",
						skill_id: "skl-025",
						level: "NSQF Level 2",
						duration_value: 240,
						duration_unit: "hours",
						mode: "offline",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-018",
						provider: "Bailhongal Rural Skill Centre"
					}],
					nearby_centres: [{
						id: "tc-040",
						name: "Government ITI Belagavi",
						district: "Belagavi",
						distance_km: 3.6
					}],
					scheme: {
						id: "sch-008",
						name_en: "KBOCWWB Welding Grant",
						issuing_authority: "Karnataka Labour Department",
						scheme_type: "Vocational Grant",
						benefit_summary: "Free safety gear kit and monthly stipend during training.",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-008",
						scheme_name: "KBOCWWB Welding Grant",
						verdict: "eligible",
						reasons: [{
							rule_id: "rule-01",
							description: "Karnataka Building Worker registration eligibility",
							passed: true,
							result: "pass"
						}]
					},
					certification_status: "Government Recognized — NCVT Level 2",
					wage_lift: {
						current: {
							occupation: "Construction Labourer",
							monthly_wage_inr: 12e3,
							status: "benchmark"
						},
						target: {
							occupation: "Shielded Metal Arc Welder",
							monthly_wage_inr: 25e3,
							status: "benchmark"
						},
						absolute_lift_inr: 13e3,
						percentage_lift: 108.3,
						absolute_difference_inr: 13e3,
						percentage_difference: 108.3,
						available: true,
						data_status: "mock",
						source_label: "Karnataka Fabrication Sector Benchmark (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 74,
						label: "Good",
						overlap_component: 17,
						gap_component: 17,
						transition_component: 20,
						training_component: 10,
						centre_component: 10,
						explanation: "Structural fabrication shops in Belagavi offer rapid job placement."
					},
					rationale: "Site fabrication experience prepares workers quickly for certified structural arc welding.",
					market_demand_note: "High demand across heavy civil infrastructure and bridge construction.",
					next_action: "Enroll in the Shielded Metal Arc Welding course at Bailhongal Rural Skill Training Centre."
				}]
			}
		}
	},
	{
		id: "autorickshaw-to-ev",
		name: "Auto-Rickshaw Driver → EV Technician",
		badge: "Transport to Electric Mobility",
		description: "Transition from commercial auto-rickshaw driving to electric vehicle service technician in Hubballi-Dharwad.",
		initialProfile: {
			occupation: "Auto-Rickshaw Driver",
			district: "Dharwad (Hubballi-Dharwad)",
			education: "12th Pass",
			career_goal_text: "I want to service and maintain electric 3-wheelers and EV batteries",
			language: "kn",
			age: 34,
			gender: "Male",
			pincode: "580020",
			latitude: null,
			longitude: null,
			session_id: "demo-sess-004"
		},
		response: {
			profile: {
				occupation: "Auto-Rickshaw Driver",
				district: "Dharwad (Hubballi-Dharwad)",
				education: "12th Pass",
				career_goal_text: "I want to service and maintain electric 3-wheelers and EV batteries",
				language: "kn",
				age: 34,
				gender: "Male",
				pincode: "580020",
				latitude: null,
				longitude: null,
				session_id: "demo-sess-004"
			},
			matched_occupation: {
				id: "occ-004",
				name_en: "Auto-Rickshaw / Commercial Driver",
				name_kn: "ಆಟೋ ರಿಕ್ಷಾ ಚಾಲಕರು",
				name_hi: "ऑटो-रिक्शा चालक",
				sector: "Automotive & Passenger Transport",
				nco_code: "8321.0100",
				is_informal_sector: true,
				description: "Commercial three-wheeler transport and fleet operation."
			},
			current_skills: [{
				id: "skl-030",
				name_en: "Commercial Driving & Road Safety Regulation",
				name_kn: "ವಾಣಿಜ್ಯ ಚಾಲನೆ ಮತ್ತು ರಸ್ತೆ ಸುರಕ್ಷತೆ",
				category: "Operational",
				skill_level: "Level 2"
			}, {
				id: "skl-031",
				name_en: "Basic IC Engine & Brake Maintenance",
				name_kn: "ವಾಹನ ನಿರ್ವಹಣೆ ಮತ್ತು ರಿಪೇರಿ",
				category: "Mechanical",
				skill_level: "Level 2"
			}],
			recommended_pathways: [{
				target_skill: {
					id: "skl-032",
					name_en: "Electric Vehicle (EV) Service Technician",
					name_kn: "ಇವಿ ಸೇವಾ ತಂತ್ರಜ್ಞ",
					name_hi: "इलेक्ट्रिक वाहन (EV) तकनीशियन",
					category: "Clean Energy & Automotive",
					skill_level: "Level 4"
				},
				bridge_skills: [{
					id: "skl-033",
					name_en: "High Voltage EV Battery Safety & Diagnostics",
					name_kn: "ಇವಿ ಬ್ಯಾಟರಿ ಸುರಕ್ಷತೆ ಮತ್ತು ತಪಾಸಣೆ",
					category: "Specialized Technical",
					skill_level: "Level 3"
				}],
				rationale: "Rapid conversion of urban fleets to electric autos in Karnataka creates massive local service demand; your mechanical familiarity enables swift upskilling into battery diagnosis.",
				confidence: "data-driven",
				courses: [{
					id: "crs-008",
					title: "Electric Vehicle Service Lead Technician (ASC/Q1424)",
					skill_id: "skl-032",
					level: "NSQF Level 4",
					duration_value: 360,
					duration_unit: "hours",
					mode: "offline",
					is_government_recognized: true,
					certifying_body: "Automotive Skills Development Council (ASDC)",
					fee_type: "free",
					fee_amount_inr: 0,
					source_id: "src-019",
					provider: "Karnataka German Technical Training Institute (KGTTI) Hubballi"
				}],
				centres: [{
					id: "tc-055",
					name: "KGTTI Hubballi Technical Campus",
					district: "Dharwad",
					taluk: "Hubballi",
					address: "Gokul Road, Industrial Estate, Hubballi, Karnataka 580030",
					latitude: 15.3524,
					longitude: 75.1218,
					recognition_status: "govt-recognized",
					contact_phone: "+91 836 233 4400",
					distance_km: 4.8,
					distance_type: "exact"
				}]
			}],
			skill_gaps: [{
				skill_id: "skl-032",
				skill_name: "EV Powertrain & BMS Diagnostics",
				skill_category: "Automotive",
				gap_type: "target",
				rationale: "Essential for diagnostic scanner usage, regenerative braking inspection, and lithium battery maintenance.",
				has_it: false,
				how_to_close: "Complete ASDC Level 4 EV Technician Course (crs-008)"
			}],
			courses: [{
				id: "crs-008",
				title: "Electric Vehicle Service Lead Technician (ASC/Q1424)",
				skill_id: "skl-032",
				level: "NSQF Level 4",
				duration_value: 360,
				duration_unit: "hours",
				mode: "offline",
				is_government_recognized: true,
				certifying_body: "Automotive Skills Development Council (ASDC)",
				fee_type: "free",
				fee_amount_inr: 0,
				source_id: "src-019",
				provider: "KGTTI Hubballi"
			}],
			nearby_centres: [{
				id: "tc-055",
				name: "KGTTI Hubballi Technical Campus",
				district: "Dharwad",
				taluk: "Hubballi",
				address: "Gokul Road, Industrial Estate, Hubballi, Karnataka 580030",
				latitude: 15.3524,
				longitude: 75.1218,
				recognition_status: "govt-recognized",
				contact_phone: "+91 836 233 4400",
				distance_km: 4.8,
				distance_type: "exact"
			}],
			schemes: [{
				id: "sch-001",
				name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
				name_kn: "ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ",
				issuing_authority: "Karnataka Skill Development Corporation",
				benefit_summary: "Free certified EV technology curriculum and placement linkages across authorized dealership service networks.",
				status: "active"
			}],
			eligibility: [{
				scheme_id: "sch-001",
				scheme_name: "CMKKY Emerging Tech Grant",
				verdict: "eligible",
				reasons: [{
					rule_id: "rule-ev-01",
					field_path: "profile.education",
					human_readable_condition: "Minimum 10th/12th qualification for Level 4 curriculum",
					result: "pass"
				}],
				required_documents: [{
					document_id: "doc-001",
					document_name: "Aadhaar Card",
					mandatory: true
				}, {
					document_id: "doc-012",
					document_name: "Commercial Driving Badge / DL",
					mandatory: false
				}]
			}],
			documents: [{
				document_id: "doc-001",
				document_name: "Aadhaar Card",
				mandatory: true
			}],
			evidence_count: 2,
			warnings: [],
			explanation: {
				summary: "With automotive transition toward electric mobility in North Karnataka, your vehicle operational experience positions you perfectly for EV diagnostics and battery servicing.",
				skill_gap_explanation: "Key technical gaps are high-voltage safety standards, battery management systems (BMS), and electric motor controller calibration.",
				pathway_explanation: "KGTTI Hubballi features specialized clean-tech EV laboratories with certified trainers from international partnerships.",
				next_steps: [
					"Visit the KGTTI campus on Gokul Road, Hubballi for course counseling.",
					"Enroll in the ASDC EV Technician module supported by state vocational grants.",
					"Connect with regional EV commercial dealership networks for apprenticeship placement."
				],
				limitations: ["High-voltage live battery training requires strict compliance with industrial protective safety gear."]
			},
			validated_evidence: [{
				chunk_id: "chk-019",
				source_id: "src-019",
				authority: "Automotive Skills Development Council (ASDC)",
				excerpt: "ASC/Q1424 qualifications prepare technicians to service electric 2-wheelers, 3-wheelers, and commercial fleet charging infrastructure.",
				page_or_section: "National Occupational Standards (NOS) ASDC",
				source_url: "https://asdc.org.in"
			}],
			explanation_status: "available",
			evidence_status: "retrieved",
			skill_bridge: {
				current_occupation: {
					id: "occ-004",
					name_en: "Auto-Rickshaw / Commercial Driver",
					name_kn: "ಆಟೋ ರಿಕ್ಷಾ ಚಾಲಕರು",
					name_hi: "ऑटो-रिक्शा चालक",
					sector: "Automotive & Passenger Transport",
					nco_code: "8321.0100",
					is_informal_sector: true,
					description: "Commercial three-wheeler transport and fleet operation."
				},
				current_skills: [{
					id: "skl-030",
					name_en: "Commercial Driving & Road Safety Regulation",
					name_kn: "ವಾಣಿಜ್ಯ ಚಾಲನೆ ಮತ್ತು ರಸ್ತೆ ಸುರಕ್ಷತೆ",
					category: "Operational",
					skill_level: "Level 2"
				}, {
					id: "skl-031",
					name_en: "Basic IC Engine & Brake Maintenance",
					name_kn: "ವಾಹನ ನಿರ್ವಹಣೆ ಮತ್ತು ರಿಪೇರಿ",
					category: "Mechanical",
					skill_level: "Level 2"
				}],
				warnings: [],
				pathways: [{
					transition_id: "trans-004-primary",
					pathway_type: "bridge",
					confidence: "data-driven",
					confidence_note: "Frontline electric transition in Hubballi-Dharwad; mechanical automotive familiarity allows fast upskilling to EV battery diagnostic benchwork.",
					current_occupation: {
						id: "occ-004",
						name_en: "Auto-Rickshaw / Commercial Driver",
						name_kn: "ಆಟೋ ರಿಕ್ಷಾ ಚಾಲಕರು",
						name_hi: "ऑटो-रिक्शा चालक",
						sector: "Automotive & Passenger Transport",
						nco_code: "8321.0100",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-040",
						name_en: "Electric Vehicle (EV) Service Technician",
						name_kn: "ಇವಿ ಸೇವಾ ತಂತ್ರಜ್ಞ",
						name_hi: "इलेक्ट्रिक वाहन (EV) तकनीशियन",
						sector: "Clean Energy & Automotive Tech",
						nco_code: "7231.0200",
						is_informal_sector: false,
						description: "Certified diagnostic specialist for lithium battery packs, motor controllers, and EV chargers."
					},
					target_skill: {
						id: "skl-032",
						name_en: "Electric Vehicle (EV) Service Technician",
						name_kn: "ಇವಿ ಸೇವಾ ತಂತ್ರಜ್ಞ",
						name_hi: "इलेक्ट्रिक वाहन (EV) तकनीशियन",
						category: "Clean Energy & Automotive",
						skill_level: "Level 4",
						is_certifiable: true,
						certifying_body: "Automotive Skills Development Council (ASDC)"
					},
					current_skills: [{
						id: "skl-030",
						name_en: "Commercial Driving & Road Safety Regulation",
						category: "Operational",
						skill_level: "Level 2"
					}, {
						id: "skl-031",
						name_en: "Basic IC Engine & Brake Maintenance",
						category: "Mechanical",
						skill_level: "Level 2"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-031"],
						overlap_skills: [{
							id: "skl-031",
							name_en: "Basic IC Engine & Brake Maintenance",
							category: "Mechanical",
							skill_level: "Level 2"
						}],
						target_skill_ids: ["skl-032", "skl-033"],
						target_skills: [{
							id: "skl-032",
							name_en: "Electric Vehicle (EV) Service Technician",
							category: "Clean Energy & Automotive",
							skill_level: "Level 4"
						}, {
							id: "skl-033",
							name_en: "High Voltage EV Battery Safety & Diagnostics",
							category: "Specialized Technical",
							skill_level: "Level 3"
						}],
						overlap_count: 1,
						total_target_skills: 2,
						overlap_percentage: 50
					},
					skill_gaps: [{
						skill_id: "skl-032",
						skill_name: "EV Powertrain & BMS Diagnostics",
						skill_category: "Automotive",
						gap_type: "target",
						rationale: "Essential for diagnostic scanner usage, regenerative braking inspection, and lithium battery maintenance.",
						has_it: false,
						how_to_close: "Complete ASDC Level 4 EV Technician Course (crs-008)"
					}],
					bridge_skills: [{
						id: "skl-033",
						name_en: "High Voltage EV Battery Safety & Diagnostics",
						name_kn: "ಇವಿ ಬ್ಯಾಟರಿ ಸುರಕ್ಷತೆ ಮತ್ತು ತಪಾಸಣೆ",
						category: "Specialized Technical",
						skill_level: "Level 3"
					}],
					courses: [{
						id: "crs-008",
						title: "Electric Vehicle Service Lead Technician (ASC/Q1424)",
						skill_id: "skl-032",
						level: "NSQF Level 4",
						duration_value: 360,
						duration_unit: "hours",
						mode: "offline",
						is_government_recognized: true,
						certifying_body: "Automotive Skills Development Council (ASDC)",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-019",
						provider: "Karnataka German Technical Training Institute (KGTTI) Hubballi"
					}],
					nearby_centres: [{
						id: "tc-055",
						name: "KGTTI Hubballi Technical Campus",
						district: "Dharwad",
						taluk: "Hubballi",
						address: "Gokul Road, Industrial Estate, Hubballi, Karnataka 580030",
						latitude: 15.3524,
						longitude: 75.1218,
						recognition_status: "govt-recognized",
						contact_phone: "+91 836 233 4400",
						distance_km: 4.8,
						distance_type: "exact"
					}],
					scheme: {
						id: "sch-001",
						name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
						name_kn: "ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ",
						issuing_authority: "Karnataka Skill Development Corporation",
						benefit_summary: "Free certified EV technology curriculum and placement linkages across authorized dealership service networks.",
						official_url: "https://kaushalkar.karnataka.gov.in",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-001",
						scheme_name: "CMKKY Emerging Tech Grant",
						verdict: "eligible",
						reasons: [{
							rule_id: "rule-ev-01",
							description: "12th Pass qualification satisfied for NSQF Level 4 curriculum",
							passed: true,
							result: "pass",
							detail: "12th Pass"
						}, {
							rule_id: "rule-ev-02",
							description: "Karnataka domicile (Dharwad district resident match)",
							passed: true,
							result: "pass",
							detail: "Dharwad"
						}]
					},
					certification_status: "Government Recognized — ASDC NSQF Level 4",
					wage_lift: {
						current: {
							occupation: "Auto-Rickshaw Driver",
							monthly_wage_inr: 18e3,
							status: "benchmark"
						},
						target: {
							occupation: "EV Technician",
							monthly_wage_inr: 32e3,
							status: "benchmark"
						},
						current_benchmark: {
							benchmark_id: "bmk-auto-01",
							occupation_name: "Auto-Rickshaw Driver",
							employment_type: "Commercial Driver",
							wage_type: "earning",
							monthly_median_inr: 18e3,
							currency: "INR",
							geography_level: "District",
							district: "Dharwad",
							source_id: "src-mock-04",
							source_title: "North Karnataka Transport Survey 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						target_benchmark: {
							benchmark_id: "bmk-ev-01",
							occupation_name: "EV Technician",
							employment_type: "Automotive Specialist",
							wage_type: "salary",
							monthly_median_inr: 32e3,
							currency: "INR",
							geography_level: "District",
							district: "Dharwad",
							source_id: "src-mock-04",
							source_title: "Hubballi-Dharwad EV Cluster Benchmark 2024 (Mock)",
							confidence: "Heuristic",
							disclaimer: "Illustrative mock data for hackathon demonstration.",
							data_status: "mock"
						},
						absolute_lift_inr: 14e3,
						percentage_lift: 77.8,
						absolute_difference_inr: 14e3,
						percentage_difference: 77.8,
						available: true,
						data_status: "mock",
						source_label: "Hubballi-Dharwad EV Cluster Benchmark (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 88,
						label: "Strong",
						overlap_component: 22,
						gap_component: 22,
						transition_component: 24,
						training_component: 10,
						centre_component: 10,
						explanation: "Rapid electrification of commercial 3-wheelers in Hubballi-Dharwad creates urgent demand for certified dealership technicians."
					},
					rationale: "Rapid conversion of urban fleets to electric autos in Karnataka creates massive local service demand; your mechanical familiarity enables swift upskilling into battery diagnosis.",
					market_demand_note: "Fastest-growing transport category in North Karnataka with EV auto conversions.",
					next_action: "Visit KGTTI Hubballi campus on Gokul Road to enroll in the free ASDC EV Technician course under CMKKY."
				}, {
					transition_id: "trans-004-alt",
					pathway_type: "bridge",
					confidence: "expert-curated",
					confidence_note: "Logistics fleet operations pathway using regional route navigation mastery.",
					current_occupation: {
						id: "occ-004",
						name_en: "Auto-Rickshaw Driver",
						sector: "Transport",
						is_informal_sector: true
					},
					target_occupation: {
						id: "occ-041",
						name_en: "Commercial Fleet Dispatcher & Fleet Coordinator",
						name_kn: "ಫ್ಲೀಟ್ ಸಂಯೋಜಕರು",
						sector: "Logistics & Supply Chain",
						nco_code: "4323.0100"
					},
					target_skill: {
						id: "skl-035",
						name_en: "GPS Fleet Telematics & Vehicle Allocation",
						category: "Logistics",
						skill_level: "Level 3"
					},
					current_skills: [{
						id: "skl-030",
						name_en: "Commercial Driving & Road Safety Regulation",
						category: "Operational",
						skill_level: "Level 2"
					}],
					skill_overlap: {
						overlap_skill_ids: ["skl-030"],
						overlap_skills: [{
							id: "skl-030",
							name_en: "Commercial Driving & Road Safety Regulation",
							category: "Operational",
							skill_level: "Level 2"
						}],
						target_skill_ids: ["skl-035"],
						target_skills: [{
							id: "skl-035",
							name_en: "GPS Fleet Telematics & Vehicle Allocation",
							category: "Logistics",
							skill_level: "Level 3"
						}],
						overlap_count: 1,
						total_target_skills: 1,
						overlap_percentage: 100
					},
					skill_gaps: [{
						skill_id: "skl-035",
						skill_name: "Fleet Telematics Software & Route Optimization",
						skill_category: "Logistics",
						gap_type: "target",
						rationale: "Supervising driver fleets via central dispatch dashboards.",
						has_it: false,
						how_to_close: "Complete Fleet Coordinator Certification"
					}],
					bridge_skills: [],
					courses: [{
						id: "crs-009",
						title: "Commercial Fleet Coordinator (NSQF Level 4)",
						skill_id: "skl-035",
						level: "NSQF Level 4",
						duration_value: 280,
						duration_unit: "hours",
						mode: "offline",
						fee_type: "free",
						fee_amount_inr: 0,
						source_id: "src-019",
						provider: "KGTTI Hubballi"
					}],
					nearby_centres: [{
						id: "tc-055",
						name: "KGTTI Hubballi Technical Campus",
						district: "Dharwad",
						distance_km: 4.8
					}],
					scheme: {
						id: "sch-001",
						name_en: "CMKKY Logistics Grant",
						issuing_authority: "KSDC",
						scheme_type: "Supply Chain Grant",
						benefit_summary: "Fully sponsored telematics certification.",
						status: "active"
					},
					eligibility: {
						scheme_id: "sch-001",
						scheme_name: "CMKKY Logistics Grant",
						verdict: "eligible",
						reasons: [{
							rule_id: "rule-01",
							description: "12th Pass minimum education match",
							passed: true,
							result: "pass"
						}]
					},
					certification_status: "Government Recognized — LSC NSQF Level 4",
					wage_lift: {
						current: {
							occupation: "Auto-Rickshaw Driver",
							monthly_wage_inr: 18e3,
							status: "benchmark"
						},
						target: {
							occupation: "Fleet Coordinator",
							monthly_wage_inr: 27e3,
							status: "benchmark"
						},
						absolute_lift_inr: 9e3,
						percentage_lift: 50,
						absolute_difference_inr: 9e3,
						percentage_difference: 50,
						available: true,
						data_status: "mock",
						source_label: "North Karnataka Logistics Survey 2024 (Mock)",
						status: "available",
						disclaimer: "Mock/illustrative data for hackathon demonstration. Not an official guarantee of income."
					},
					pathway_score: {
						total_score: 76,
						label: "Good",
						overlap_component: 19,
						gap_component: 18,
						transition_component: 19,
						training_component: 10,
						centre_component: 10,
						explanation: "Growing hub logistics in Dharwad requires experienced drivers transitioning into dispatch."
					},
					rationale: "Deep knowledge of regional traffic bottlenecks makes seasoned commercial drivers excellent fleet dispatchers.",
					market_demand_note: "Logistics distribution parks along NH48 require local coordinators.",
					next_action: "Apply for the Logistics Sector Skill Council fleet operations program at Hubballi."
				}]
			}
		}
	}
];
//#endregion
//#region src/services/api.ts
/**
* Returns the current API mode ('mock' or 'real').
* Defaults to 'mock' if unspecified, empty, or anything other than 'real'.
*/
function getApiMode() {
	const metaMode = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_MODE : void 0;
	const procMode = globalThis.process?.env?.VITE_API_MODE;
	return (metaMode || procMode || "mock").trim().toLowerCase();
}
/**
* Returns the configured backend API base URL.
*/
function getApiBaseUrl() {
	const metaUrl = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_BASE_URL : void 0;
	const procUrl = globalThis.process?.env?.VITE_API_BASE_URL;
	return (metaUrl || procUrl || "").trim();
}
/**
* Evaluates whether mock mode is active.
* Mock mode is active unless VITE_API_MODE is explicitly set to 'real'.
*/
function isMockMode() {
	return getApiMode() !== "real";
}
/**
* Returns or generates a session ID for tracking recommendations.
*/
function getOrCreateSessionId() {
	const STORAGE_KEY = "skill_navigator_session_id";
	let sessionId = null;
	if (typeof sessionStorage !== "undefined") try {
		sessionId = sessionStorage.getItem(STORAGE_KEY);
	} catch {}
	if (!sessionId) {
		const randomHex = Math.random().toString(36).substring(2, 10);
		sessionId = `sess_${Date.now()}_${randomHex}`;
		if (typeof sessionStorage !== "undefined") try {
			sessionStorage.setItem(STORAGE_KEY, sessionId);
		} catch {}
	}
	return sessionId;
}
var ApiError = class extends Error {
	statusCode;
	constructor(message, statusCode = 500) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
	}
};
/**
* Service to retrieve recommendations either from verified mock scenarios
* or the live FastAPI /api/recommendations endpoint.
*/
const recommendationsApi = { async getRecommendations(profile, scenarioId) {
	const profileWithSession = {
		...profile,
		session_id: profile.session_id || getOrCreateSessionId(),
		latitude: profile.latitude ?? null,
		longitude: profile.longitude ?? null
	};
	if (isMockMode()) {
		await new Promise((resolve) => setTimeout(resolve, 800));
		if (scenarioId) {
			const matchedScenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
			if (matchedScenario) return {
				...matchedScenario.response,
				profile: {
					...matchedScenario.response.profile,
					...profileWithSession
				}
			};
		}
		const occLower = (profile.occupation || "").toLowerCase();
		let selectedScenario = DEMO_SCENARIOS[0];
		if (occLower.includes("domestic") || occLower.includes("house") || occLower.includes("maid") || occLower.includes("tailor")) selectedScenario = DEMO_SCENARIOS[1];
		else if (occLower.includes("construction") || occLower.includes("labour") || occLower.includes("mason") || occLower.includes("fitter")) selectedScenario = DEMO_SCENARIOS[2];
		else if (occLower.includes("auto") || occLower.includes("rickshaw") || occLower.includes("driver") || occLower.includes("ev")) selectedScenario = DEMO_SCENARIOS[3];
		return {
			...selectedScenario.response,
			profile: {
				...selectedScenario.response.profile,
				...profileWithSession
			}
		};
	}
	const baseUrl = getApiBaseUrl();
	if (!baseUrl) throw new ApiError("VITE_API_BASE_URL is not configured. Please set VITE_API_BASE_URL in your .env file or switch to mock mode (VITE_API_MODE=mock).", 500);
	const cleanUrl = baseUrl.replace(/\/+$/, "");
	const endpoint = `${cleanUrl}/api/recommendations`;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15e3);
	try {
		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Session-ID": profileWithSession.session_id || ""
			},
			body: JSON.stringify(profileWithSession),
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (!response.ok) {
			let errDetail = `Server returned status ${response.status}`;
			try {
				const errJson = await response.json();
				errDetail = errJson.detail || errJson.message || errDetail;
			} catch {}
			throw new ApiError(errDetail, response.status);
		}
		return await response.json();
	} catch (error) {
		clearTimeout(timeoutId);
		if (error instanceof ApiError) throw error;
		const err = error;
		if (err.name === "AbortError") throw new ApiError(`Request to recommendation service timed out after 15 seconds (${cleanUrl}). Please verify the backend service is running and responsive.`, 504);
		if (err.name === "TypeError" || err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("networkerror") || err.message.toLowerCase().includes("econnrefused")) {
			console.error(`[API Service] Connection failed to ${endpoint}:`, err);
			throw new ApiError(`Backend service unavailable at ${cleanUrl}. Please verify the server is running on port 8001, or set VITE_API_MODE=mock in frontend/.env.`, 503);
		}
		throw new ApiError(err.message || "Network error communicating with the recommendation service", 500);
	}
} };
//#endregion
//#region tests/api_verification.test.ts
test("1. isMockMode returns true when VITE_API_MODE=mock", () => {
	process.env.VITE_API_MODE = "mock";
	assert.equal(getApiMode(), "mock");
	assert.equal(isMockMode(), true);
});
test("2. isMockMode returns true when VITE_API_MODE is undefined or empty", () => {
	delete process.env.VITE_API_MODE;
	assert.equal(isMockMode(), true);
	process.env.VITE_API_MODE = "";
	assert.equal(isMockMode(), true);
});
test("3. isMockMode returns false when VITE_API_MODE=real", () => {
	process.env.VITE_API_MODE = "real";
	assert.equal(getApiMode(), "real");
	assert.equal(isMockMode(), false);
	process.env.VITE_API_MODE = "mock";
});
test("4. getRecommendations returns delivery-to-electrician for delivery worker in mock mode", async () => {
	process.env.VITE_API_MODE = "mock";
	const res = await recommendationsApi.getRecommendations({
		occupation: "Delivery / Courier Rider",
		district: "Bengaluru Urban",
		career_goal_text: "Electrician",
		education: "10th Pass",
		pincode: "560001",
		age: 25,
		gender: "Male",
		latitude: null,
		longitude: null,
		session_id: "test-sess-1"
	});
	assert.ok(res);
	assert.equal(res.profile.occupation, "Delivery / Courier Rider");
	assert.ok(res.recommended_pathways.length > 0);
	assert.match(res.recommended_pathways[0].target_skill.name_en, /Electrician/i);
});
test("5. getRecommendations returns domestic-worker scenario for domestic worker in mock mode", async () => {
	process.env.VITE_API_MODE = "mock";
	const res = await recommendationsApi.getRecommendations({
		occupation: "Domestic Worker / Housekeeper",
		district: "Mysuru",
		career_goal_text: "Tailoring",
		education: "8th Pass",
		pincode: "570001",
		age: 32,
		gender: "Female",
		latitude: null,
		longitude: null,
		session_id: "test-sess-2"
	});
	assert.ok(res);
	assert.equal(res.profile.occupation, "Domestic Worker / Housekeeper");
	assert.ok(res.recommended_pathways.length > 0);
	assert.match(res.recommended_pathways[0].target_skill.name_en, /Tailor/i);
});
test("6. getRecommendations returns construction-to-fitter scenario for construction worker in mock mode", async () => {
	process.env.VITE_API_MODE = "mock";
	const res = await recommendationsApi.getRecommendations({
		occupation: "Construction Labourer",
		district: "Belagavi",
		career_goal_text: "Factory Fitter",
		education: "No Formal Education",
		pincode: "590001",
		age: 28,
		gender: "Male",
		latitude: null,
		longitude: null,
		session_id: "test-sess-3"
	});
	assert.ok(res);
	assert.equal(res.profile.occupation, "Construction Labourer");
	assert.ok(res.recommended_pathways.length > 0);
	assert.match(res.recommended_pathways[0].target_skill.name_en, /Fitter/i);
});
test("7. getRecommendations returns autorickshaw-to-ev scenario for auto driver in mock mode", async () => {
	process.env.VITE_API_MODE = "mock";
	const res = await recommendationsApi.getRecommendations({
		occupation: "Auto-Rickshaw Driver",
		district: "Dharwad",
		career_goal_text: "EV Technician",
		education: "12th Pass",
		pincode: "580020",
		age: 34,
		gender: "Male",
		latitude: null,
		longitude: null,
		session_id: "test-sess-4"
	});
	assert.ok(res);
	assert.equal(res.profile.occupation, "Auto-Rickshaw Driver");
	assert.ok(res.recommended_pathways.length > 0);
	assert.match(res.recommended_pathways[0].target_skill.name_en, /Electric Vehicle|EV/i);
});
test("8. getRecommendations with explicit scenarioId returns that specific scenario", async () => {
	process.env.VITE_API_MODE = "mock";
	const res = await recommendationsApi.getRecommendations({
		occupation: "Random Occupation",
		district: "Bengaluru Urban",
		career_goal_text: "Goal",
		education: null,
		pincode: null,
		age: null,
		gender: null,
		latitude: null,
		longitude: null,
		session_id: "test-sess-5"
	}, "domestic-worker-to-tailoring");
	assert.ok(res);
	assert.equal(res.matched_occupation.name_en, "Domestic Worker / Household Assistant");
});
test("9. session_id is preserved or generated in returned recommendation profile", async () => {
	process.env.VITE_API_MODE = "mock";
	const res1 = await recommendationsApi.getRecommendations({
		occupation: "Delivery / Courier Rider",
		district: "Bengaluru Urban",
		career_goal_text: "Electrician",
		education: null,
		pincode: null,
		age: null,
		gender: null,
		latitude: null,
		longitude: null,
		session_id: "custom-session-12345"
	});
	assert.equal(res1.profile.session_id, "custom-session-12345");
	const res2 = await recommendationsApi.getRecommendations({
		occupation: "Delivery / Courier Rider",
		district: "Bengaluru Urban",
		career_goal_text: "Electrician",
		education: null,
		pincode: null,
		age: null,
		gender: null,
		latitude: null,
		longitude: null
	});
	assert.ok(res2.profile.session_id);
	assert.match(res2.profile.session_id, /^sess_/);
});
test("10. In real mode with unreachable backend / network failure, throws clear, descriptive error message (not raw \"Failed to fetch\")", async () => {
	process.env.VITE_API_MODE = "real";
	process.env.VITE_API_BASE_URL = "http://127.0.0.1:59999";
	const profile = {
		occupation: "Delivery / Courier Rider",
		district: "Bengaluru Urban",
		career_goal_text: "Electrician",
		education: null,
		pincode: null,
		age: null,
		gender: null,
		latitude: null,
		longitude: null,
		session_id: "test-sess-err"
	};
	const originalConsoleError = console.error;
	console.error = () => {};
	try {
		await recommendationsApi.getRecommendations(profile);
		assert.fail("Expected ApiError to be thrown");
	} catch (err) {
		assert.ok(err instanceof ApiError);
		assert.notEqual(err.message, "Failed to fetch");
		assert.match(err.message, /Backend service unavailable/i);
		assert.match(err.message, /59999/);
	} finally {
		console.error = originalConsoleError;
		process.env.VITE_API_MODE = "mock";
		process.env.VITE_API_BASE_URL = "http://localhost:8001";
	}
});
//#endregion
//#region src/services/voiceAssistantService.ts
const KARNATAKA_DISTRICTS = [
	"Bagalkote",
	"Ballari",
	"Belagavi",
	"Bengaluru Rural",
	"Bengaluru Urban",
	"Bidar",
	"Chamarajanagara",
	"Chikkaballapura",
	"Chikkamagaluru",
	"Chitradurga",
	"Dakshina Kannada",
	"Davanagere",
	"Dharwad",
	"Gadag",
	"Hassan",
	"Haveri",
	"Kalaburagi",
	"Kodagu",
	"Kolar",
	"Koppal",
	"Mandya",
	"Mysuru",
	"Raichur",
	"Ramanagara",
	"Shivamogga",
	"Tumakuru",
	"Udupi",
	"Uttara Kannada",
	"Vijayanagara",
	"Vijayapura",
	"Yadgir"
];
var VoiceAssistantService = class {
	state;
	listeners = /* @__PURE__ */ new Set();
	language = "en";
	speechRecognition = null;
	mediaRecorder = null;
	audioChunks = [];
	currentAudioElement = null;
	isSynthesisSpeaking = false;
	onRequestRecommendations;
	constructor(initialLanguage = "en", initialProfile, onRequestRecommendations) {
		this.language = initialLanguage;
		this.onRequestRecommendations = onRequestRecommendations;
		this.state = {
			voiceState: "IDLE",
			dialogueStep: "WELCOME",
			messages: [],
			currentTranscript: "",
			lastAssistantSpeech: "",
			profile: {
				occupation: initialProfile?.occupation || "",
				career_goal_text: initialProfile?.career_goal_text || "",
				district: initialProfile?.district || "",
				pincode: initialProfile?.pincode || null,
				age: initialProfile?.age || null,
				gender: initialProfile?.gender || null,
				latitude: null,
				longitude: null,
				session_id: initialProfile?.session_id || `sess_voice_${Date.now()}`
			},
			recommendation: null,
			quickReplies: [
				"Start",
				"ಕನ್ನಡ",
				"हिन्दी"
			]
		};
		this.initWebSpeech();
	}
	subscribe(listener) {
		this.listeners.add(listener);
		listener(this.state);
		return () => this.listeners.delete(listener);
	}
	notify() {
		for (const listener of this.listeners) listener({ ...this.state });
	}
	setLanguage(lang) {
		this.language = lang;
		this.state.profile.language = lang === "kn" ? "Kannada" : lang === "hi" ? "Hindi" : "English";
		this.notify();
	}
	getLanguage() {
		return this.language;
	}
	getState() {
		return { ...this.state };
	}
	/**
	* Initialize browser SpeechRecognition if available (for Development / Demo mode)
	*/
	initWebSpeech() {
		if (typeof window !== "undefined") {
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			if (SpeechRecognition) try {
				this.speechRecognition = new SpeechRecognition();
				this.speechRecognition.continuous = false;
				this.speechRecognition.interimResults = true;
				this.speechRecognition.onresult = (event) => {
					let transcript = "";
					for (let i = event.resultIndex; i < event.results.length; ++i) transcript += event.results[i][0].transcript;
					this.state.currentTranscript = transcript;
					this.notify();
					if (event.results[0].isFinal) this.handleUserInput(transcript.trim());
				};
				this.speechRecognition.onerror = (event) => {
					console.warn("[VoiceAssistant] Speech recognition error:", event.error);
					if (event.error !== "no-speech") {
						this.state.voiceState = "ERROR";
						this.state.errorMessage = this.getLocalizedText({
							en: "I couldn't hear that clearly. Please try again or type below.",
							kn: "ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬರೆಯಿರಿ.",
							hi: "मैं ठीक से सुन नहीं पाया। कृपया पुनः प्रयास करें या नीचे टाइप करें।"
						});
						this.notify();
					} else {
						this.state.voiceState = "IDLE";
						this.notify();
					}
				};
				this.speechRecognition.onend = () => {
					if (this.state.voiceState === "LISTENING") {
						this.state.voiceState = "IDLE";
						this.notify();
					}
				};
			} catch (e) {
				console.warn("[VoiceAssistant] Web speech recognition init failed:", e);
			}
		}
	}
	/**
	* Start initial greeting and dialogue flow
	*/
	startConversation() {
		this.state.dialogueStep = "WELCOME";
		this.state.messages = [];
		const welcomeMsg = this.getLocalizedText({
			en: "Namaskara! I am your Skill Navigator. I can help you find suitable skills, training centres near you, and government support. What work do you currently do?",
			kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಕಿಲ್ ನ್ಯಾವಿಗೇಟರ್. ಸೂಕ್ತವಾದ ಕೌಶಲ್ಯಗಳು, ಹತ್ತಿರದ ತರಬೇತಿ ಕೇಂದ್ರಗಳು ಮತ್ತು ಸರ್ಕಾರಿ ಬೆಂಬಲವನ್ನು ಹುಡುಕಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಪ್ರಸ್ತುತ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
			hi: "नमस्कार! मैं आपका स्किल नेविगेटर हूँ। मैं आपके लिए सही कौशल, नजदीکی प्रशिक्षण केंद्र और सरकारी योजनाएं खोजने में मदद कर सकता हूँ। आप अभी कौन सा काम करते हैं?"
		});
		this.speakAndRecord(welcomeMsg, "OCCUPATION", [
			"Delivery Rider",
			"Auto Driver",
			"Construction Labourer",
			"Domestic Worker"
		]);
	}
	/**
	* Primary voice interaction button handler: Toggle Listening
	*/
	toggleListening() {
		if (this.state.voiceState === "LISTENING") this.stopListening();
		else this.startListening();
	}
	async startListening() {
		if (this.isSynthesisSpeaking) {
			if (this.currentAudioElement) try {
				this.currentAudioElement.pause();
				this.currentAudioElement = null;
			} catch (e) {}
			if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
			this.isSynthesisSpeaking = false;
		}
		this.state.voiceState = "LISTENING";
		this.state.currentTranscript = "";
		this.state.errorMessage = void 0;
		this.notify();
		if (typeof navigator !== "undefined" && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function" && typeof window.MediaRecorder !== "undefined") try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.audioChunks = [];
			const recorder = new window.MediaRecorder(stream);
			this.mediaRecorder = recorder;
			recorder.ondataavailable = (event) => {
				if (event.data && event.data.size > 0) this.audioChunks.push(event.data);
			};
			recorder.onstop = async () => {
				try {
					stream.getTracks().forEach((track) => track.stop());
				} catch (e) {}
				if (this.audioChunks.length > 0) {
					const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
					await this.sendAudioToWhisper(audioBlob);
				} else {
					this.state.voiceState = "IDLE";
					this.notify();
				}
			};
			recorder.start(250);
			return;
		} catch (err) {
			console.warn("[VoiceAssistant] MediaRecorder unavailable or microphone denied, using fallback:", err);
		}
		if (this.speechRecognition) try {
			const langMap = {
				en: "en-IN",
				kn: "kn-IN",
				hi: "hi-IN"
			};
			this.speechRecognition.lang = langMap[this.language] || "en-IN";
			this.speechRecognition.start();
		} catch (err) {}
		else {
			this.state.voiceState = "IDLE";
			this.state.errorMessage = this.getLocalizedText({
				en: "Microphone is unavailable. You can use the text input below.",
				kn: "ಮೈಕ್ರೊಫೋನ್ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಪಠ್ಯ ಇನ್‌ಪುಟ್ ಬಳಸಿ.",
				hi: "माइक उपलब्ध नहीं है। कृपया नीचे टेक्स्ट इनपुट का उपयोग करें।"
			});
			this.notify();
		}
	}
	stopListening() {
		if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") try {
			this.mediaRecorder.stop();
			this.state.voiceState = "PROCESSING";
			this.notify();
			return;
		} catch (err) {}
		if (this.speechRecognition) try {
			this.speechRecognition.stop();
		} catch (err) {}
		this.state.voiceState = "IDLE";
		this.notify();
	}
	async sendAudioToWhisper(blob) {
		this.state.voiceState = "PROCESSING";
		this.notify();
		try {
			const reader = new FileReader();
			reader.onloadend = async () => {
				const resultStr = reader.result || "";
				const base64Audio = resultStr.includes(",") ? resultStr.split(",")[1] : resultStr;
				try {
					const res = await fetch("/api/voice/transcribe", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							audio_base64: base64Audio,
							language: this.language,
							session_id: this.state.profile.session_id
						})
					});
					if (res.ok) {
						const data = await res.json();
						if (data.transcript && data.transcript.trim()) {
							await this.handleUserInput(data.transcript.trim());
							return;
						}
					}
				} catch (apiErr) {
					console.warn("[VoiceAssistant] Whisper API call failed:", apiErr);
				}
				this.state.voiceState = "ERROR";
				this.state.errorMessage = this.getLocalizedText({
					en: "I couldn't hear that clearly. Please try again or type below.",
					kn: "ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಬರೆಯಿರಿ.",
					hi: "मैं ठीक से सुन नहीं पाया। कृपया पुनः प्रयास करें या नीचे टाइप करें।"
				});
				this.notify();
			};
			reader.readAsDataURL(blob);
		} catch (readErr) {
			this.state.voiceState = "IDLE";
			this.notify();
		}
	}
	/**
	* Receive user input either from SpeechRecognition or direct text fallback
	*/
	async handleUserInput(rawText) {
		if (!rawText || !rawText.trim()) return;
		const text = rawText.trim();
		this.state.messages.push({
			id: `msg_u_${Date.now()}`,
			sender: "user",
			text,
			timestamp: Date.now()
		});
		this.state.currentTranscript = "";
		this.state.voiceState = "PROCESSING";
		this.notify();
		await new Promise((r) => setTimeout(r, 400));
		const lower = text.toLowerCase();
		if (lower === "stop" || lower === "exit" || lower === "later" || lower.includes("stop") || lower.includes("nillisi") || lower.includes("bandh")) {
			const stopMsg = this.getLocalizedText({
				en: "Sure, we can pause here. Whenever you are ready, tap the microphone to continue.",
				kn: "ಖಂಡಿತ, ನಾವು ಇಲ್ಲಿ ನಿಲ್ಲಿಸಬಹುದು. ನೀವು ಸಿದ್ಧರಾದಾಗ ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿರಿ.",
				hi: "ज़रूर, हम यहाँ रुक सकते हैं। जब भी आप तैयार हों, जारी रखने के लिए माइक दबाएँ।"
			});
			this.speakAndRecord(stopMsg, "STOPPED", ["Start Again"]);
			return;
		}
		if (lower.includes("speak kannada") || lower.includes("kannada alli") || lower === "kannada" || lower === "ಕನ್ನಡ") {
			this.setLanguage("kn");
			this.speakAndRecord("ಖಂಡಿತ, ನಾವು ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಸೋಣ. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿವರಗಳನ್ನು ಉಳಿಸಿಕೊಳ್ಳಲಾಗಿದೆ.", this.state.dialogueStep, this.state.quickReplies);
			return;
		}
		if (lower.includes("speak hindi") || lower.includes("hindi mein") || lower === "hindi" || lower === "हिन्दी" || lower === "हिंदी") {
			this.setLanguage("hi");
			this.speakAndRecord("ज़रूर, अब हम हिंदी में बात करेंगे। आपकी पिछली जानकारी सुरक्षित है।", this.state.dialogueStep, this.state.quickReplies);
			return;
		}
		if (lower.includes("speak english") || lower === "english" || lower.includes("in english")) {
			this.setLanguage("en");
			this.speakAndRecord("Sure, let us continue in English. Your profile information is preserved.", this.state.dialogueStep, this.state.quickReplies);
			return;
		}
		if (lower.includes("repeat") || lower.includes("again") || lower === "what" || lower.includes("didn't understand") || lower.includes("motte heli") || lower.includes("phir se")) {
			if (this.state.lastAssistantSpeech) this.speak(this.state.lastAssistantSpeech);
			this.state.voiceState = "IDLE";
			this.notify();
			return;
		}
		if (lower.includes("go back") || lower.includes("previous") || lower === "back" || lower.includes("hinde") || lower.includes("peeche")) {
			this.handleGoBack();
			return;
		}
		if (lower.includes("simplify") || lower.includes("easy words") || lower.includes("samajh nahi") || lower.includes("arthavaglilla")) {
			this.handleSimplify();
			return;
		}
		switch (this.state.dialogueStep) {
			case "WELCOME":
			case "LANGUAGE":
				this.askOccupation();
				break;
			case "OCCUPATION":
				this.handleOccupationInput(text);
				break;
			case "OCCUPATION_CONFIRM":
				this.handleOccupationConfirm(text);
				break;
			case "GOAL":
				this.handleGoalInput(text);
				break;
			case "GOAL_CONFIRM":
				this.handleGoalConfirm(text);
				break;
			case "DISTRICT":
				this.handleDistrictInput(text);
				break;
			case "DISTRICT_CONFIRM":
				this.handleDistrictConfirm(text);
				break;
			case "REVIEW":
				this.handleReviewConfirm(text);
				break;
			case "PROGRESSIVE_OVERVIEW":
				this.handleProgressiveNext("PROGRESSIVE_COURSE", text);
				break;
			case "PROGRESSIVE_COURSE":
				this.handleProgressiveNext("PROGRESSIVE_CENTRE", text);
				break;
			case "PROGRESSIVE_CENTRE":
				this.handleProgressiveNext("PROGRESSIVE_SCHEME", text);
				break;
			case "PROGRESSIVE_SCHEME":
				this.handleProgressiveNext("PROGRESSIVE_NEXT_STEPS", text);
				break;
			case "PROGRESSIVE_NEXT_STEPS":
			case "COMPLETED":
			case "STOPPED":
				if (this.isAffirmative(text) || lower.includes("start") || lower.includes("again")) this.startConversation();
				else {
					this.state.voiceState = "IDLE";
					this.notify();
				}
				break;
			default:
				this.state.voiceState = "IDLE";
				this.notify();
		}
	}
	askOccupation() {
		const prompt = this.getLocalizedText({
			en: "What work are you currently doing? For example: delivery rider, auto driver, or construction worker.",
			kn: "ನೀವು ಪ್ರಸ್ತುತ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ? ಉದಾಹರಣೆಗೆ: ಡೆಲಿವರಿ ರೈಡರ್, ಆಟೋ ಚಾಲಕ ಅಥವಾ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ.",
			hi: "आप वर्तमान में क्या काम करते हैं? जैसे: डिलीवरी राइडर, ऑटो चालक, या निर्माण श्रमिक।"
		});
		this.speakAndRecord(prompt, "OCCUPATION", [
			"Delivery Rider",
			"Auto Driver",
			"Construction Labourer",
			"Domestic Worker"
		]);
	}
	handleOccupationInput(text) {
		const normalized = this.normalizeOccupation(text);
		this.state.pendingValue = normalized;
		const confirmPrompt = this.getLocalizedText({
			en: `I understood that you work as a ${normalized}. Is that correct?`,
			kn: `ನೀವು ${normalized} ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಇದು ಸರಿಯೇ?`,
			hi: `मैं समझा कि आप ${normalized} का काम करते हैं। क्या यह सही है?`
		});
		this.speakAndRecord(confirmPrompt, "OCCUPATION_CONFIRM", [
			"Yes",
			"No",
			"Change Work"
		]);
	}
	handleOccupationConfirm(text) {
		if (this.isAffirmative(text)) {
			this.state.profile.occupation = this.state.pendingValue || this.state.profile.occupation;
			this.state.pendingValue = void 0;
			const goalPrompt = this.getLocalizedText({
				en: "What would you like to learn or do next? If you are not sure, you can say 'I don't know'.",
				kn: "ಮುಂದೆ ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ನಿಮಗೆ ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ, 'ಗೊತ್ತಿಲ್ಲ' ಎಂದು ಹೇಳಬಹುದು.",
				hi: "आगे आप क्या सीखना या करना चाहते हैं? यदि आपको पता नहीं है, तो आप 'मुझे नहीं पता' कह सकते हैं।"
			});
			this.speakAndRecord(goalPrompt, "GOAL", [
				"Electrician",
				"EV Service Technician",
				"I don't know"
			]);
		} else {
			const retryPrompt = this.getLocalizedText({
				en: "No problem. Please tell me what work you do.",
				kn: "ಪರವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ ಎಂದು ಹೇಳಿ.",
				hi: "कोई बात नहीं। कृपया मुझे बताएं कि आप क्या काम करते हैं।"
			});
			this.speakAndRecord(retryPrompt, "OCCUPATION", [
				"Delivery Rider",
				"Auto Driver",
				"Construction Labourer"
			]);
		}
	}
	handleGoalInput(text) {
		if (this.isDontKnow(text)) {
			this.state.profile.career_goal_text = "I want suggestions based on my current work";
			const dontKnowMsg = this.getLocalizedText({
				en: "That's okay. I can suggest options based on the work you do now. Which district in Karnataka are you located in?",
				kn: "ಪರವಾಗಿಲ್ಲ. ನೀವು ಈಗ ಮಾಡುತ್ತಿರುವ ಕೆಲಸದ ಆಧಾರದ ಮೇಲೆ ನಾನು ಆಯ್ಕೆಗಳನ್ನು ಸೂಚಿಸುತ್ತೇನೆ. ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?",
				hi: "कोई बात नहीं। आप अभी जो काम करते हैं, उसके आधार पर मैं विकल्प सुझा सकता हूँ। आप कर्नाटक के किस जिले में हैं?"
			});
			this.speakAndRecord(dontKnowMsg, "DISTRICT", [
				"Bengaluru Urban",
				"Mysuru",
				"Belagavi",
				"Dakshina Kannada"
			]);
			return;
		}
		const normalizedGoal = this.normalizeGoal(text);
		this.state.pendingValue = normalizedGoal;
		const confirmGoalPrompt = this.getLocalizedText({
			en: `I understood that you want to learn ${normalizedGoal}. Is that correct?`,
			kn: `ನೀವು ${normalizedGoal} ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡೆ. ಇದು ಸರಿಯೇ?`,
			hi: `मैं समझा कि आप ${normalizedGoal} सीखना चाहते हैं। क्या यह सही है?`
		});
		this.speakAndRecord(confirmGoalPrompt, "GOAL_CONFIRM", [
			"Yes",
			"No",
			"Change Goal"
		]);
	}
	handleGoalConfirm(text) {
		if (this.isAffirmative(text)) {
			this.state.profile.career_goal_text = this.state.pendingValue || this.state.profile.career_goal_text;
			this.state.pendingValue = void 0;
			const districtPrompt = this.getLocalizedText({
				en: "Which district in Karnataka are you in?",
				kn: "ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?",
				hi: "आप कर्नाटक के किस जिले में हैं?"
			});
			this.speakAndRecord(districtPrompt, "DISTRICT", [
				"Bengaluru Urban",
				"Mysuru",
				"Belagavi",
				"Dakshina Kannada"
			]);
		} else {
			const retryGoalPrompt = this.getLocalizedText({
				en: "What would you like to learn or do? You can also say 'I don't know'.",
				kn: "ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ? ನೀವು 'ಗೊತ್ತಿಲ್ಲ' ಎಂದೂ ಹೇಳಬಹುದು.",
				hi: "आप क्या सीखना चाहते हैं? आप 'मुझे नहीं पता' भी कह सकते हैं।"
			});
			this.speakAndRecord(retryGoalPrompt, "GOAL", [
				"Electrician",
				"EV Service Technician",
				"I don't know"
			]);
		}
	}
	handleDistrictInput(text) {
		const matchedDistrict = this.findMatchingDistrict(text);
		this.state.pendingValue = matchedDistrict;
		const confirmDistrictPrompt = this.getLocalizedText({
			en: `I heard ${matchedDistrict}. Is that correct?`,
			kn: `ನಾನು ${matchedDistrict} ಎಂದು ಕೇಳಿದೆ. ಇದು ಸರಿಯೇ?`,
			hi: `मैंने ${matchedDistrict} सुना। क्या यह सही है?`
		});
		this.speakAndRecord(confirmDistrictPrompt, "DISTRICT_CONFIRM", [
			"Yes",
			"No",
			"Change District"
		]);
	}
	handleDistrictConfirm(text) {
		if (this.isAffirmative(text)) {
			this.state.profile.district = this.state.pendingValue || this.state.profile.district;
			this.state.pendingValue = void 0;
			this.presentProfileReview();
		} else {
			const retryDistrictPrompt = this.getLocalizedText({
				en: "Which district in Karnataka do you live or work in?",
				kn: "ನೀವು ಕರ್ನಾಟಕದ ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಿ ಅಥವಾ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
				hi: "आप कर्नाटक के किस जिले में रहते हैं या काम करते हैं?"
			});
			this.speakAndRecord(retryDistrictPrompt, "DISTRICT", [
				"Bengaluru Urban",
				"Mysuru",
				"Belagavi"
			]);
		}
	}
	presentProfileReview() {
		const occ = this.state.profile.occupation;
		const goal = this.state.profile.career_goal_text;
		const dist = this.state.profile.district;
		const reviewPrompt = this.getLocalizedText({
			en: `You told me: You work as a ${occ}. Your goal is ${goal}. You are in ${dist}. Is this information correct?`,
			kn: `ನಿಮ್ಮ ವಿವರ: ಕೆಲಸ: ${occ}. ಗುರಿ: ${goal}. ಜಿಲ್ಲೆ: ${dist}. ಇದು ಸರಿಯಾಗಿದೆಯೇ?`,
			hi: `आपकी जानकारी: काम: ${occ}, लक्ष्य: ${goal}, जिला: ${dist}। क्या यह सही है?`
		});
		this.speakAndRecord(reviewPrompt, "REVIEW", [
			"Yes, Find Options",
			"Change Work",
			"Change Goal",
			"Change District"
		]);
	}
	async handleReviewConfirm(text) {
		const lower = text.toLowerCase();
		if (lower.includes("work") || lower.includes("occupation") || lower.includes("kelasa")) {
			this.askOccupation();
			return;
		}
		if (lower.includes("goal") || lower.includes("learn") || lower.includes("guri")) {
			const goalPrompt = this.getLocalizedText({
				en: "What would you like to learn or do?",
				kn: "ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
				hi: "आप क्या सीखना या करना चाहते हैं?"
			});
			this.speakAndRecord(goalPrompt, "GOAL", [
				"Electrician",
				"EV Service Technician",
				"I don't know"
			]);
			return;
		}
		if (lower.includes("district") || lower.includes("location") || lower.includes("jille")) {
			const distPrompt = this.getLocalizedText({
				en: "Which district are you in?",
				kn: "ನೀವು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?",
				hi: "आप किस जिले में हैं?"
			});
			this.speakAndRecord(distPrompt, "DISTRICT", [
				"Bengaluru Urban",
				"Mysuru",
				"Belagavi"
			]);
			return;
		}
		if (this.isAffirmative(text) || lower.includes("find") || lower.includes("options")) {
			this.state.dialogueStep = "RECOMMENDING";
			this.state.voiceState = "PROCESSING";
			const findingMsg = this.getLocalizedText({
				en: "Looking for verified skill pathways and training options for you...",
				kn: "ನಿಮಗಾಗಿ ಪರಿಶೀಲಿಸಿದ ಕೌಶಲ್ಯ ಮಾರ್ಗಗಳು ಮತ್ತು ತರಬೇತಿ ಆಯ್ಕೆಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
				hi: "आपके लिए सत्यापित कौशल मार्ग और प्रशिक्षण विकल्प खोजे जा रहे हैं..."
			});
			this.speakAndRecord(findingMsg, "RECOMMENDING", []);
			try {
				if (this.onRequestRecommendations) {
					const rec = await this.onRequestRecommendations(this.state.profile);
					this.state.recommendation = rec;
					this.startProgressiveExplanation(rec);
				} else {
					this.state.voiceState = "IDLE";
					this.notify();
				}
			} catch (err) {
				this.state.voiceState = "ERROR";
				this.state.errorMessage = err.message || "Error fetching recommendations";
				const errVoice = this.getLocalizedText({
					en: "I couldn't load recommendations right now. You can try again or check your details.",
					kn: "ಈಗ ಶಿಫಾರಸುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
					hi: "अभी सिफारिशें लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।"
				});
				this.speakAndRecord(errVoice, "STOPPED", ["Try Again", "Go Back"]);
			}
		} else this.presentProfileReview();
	}
	startProgressiveExplanation(rec) {
		this.state.recommendation = rec;
		const topPathway = (rec.recommended_pathways || [])[0];
		if (!topPathway || !topPathway.target_skill) {
			const noPathwayMsg = this.getLocalizedText({
				en: "I couldn't find a verified skill pathway for that specific goal yet in our state records. Would you like to try another work goal?",
				kn: "ಆ ಗುರಿಗೆ ಇನ್ನೂ ನಮ್ಮ ದಾಖಲೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಕೌಶಲ್ಯ ಮಾರ್ಗ ದೊರೆತಿಲ್ಲ. ನೀವು ಬೇರೆ ಗುರಿಯನ್ನು ಪ್ರಯತ್ನಿಸಲು ಬಯಸುತ್ತೀರಾ?",
				hi: "उस लक्ष्य के लिए अभी कोई सत्यापित कौशल मार्ग उपलब्ध नहीं है। क्या आप कोई अन्य लक्ष्य आज़माना चाहेंगे?"
			});
			this.speakAndRecord(noPathwayMsg, "COMPLETED", ["Try Another Goal", "Start Over"]);
			return;
		}
		const topBridge = (rec.skill_bridge?.pathways || [])[0];
		const skillName = topBridge?.target_occupation?.name_en || topPathway.target_skill.name_en;
		let extraContextEn = "";
		if (topBridge) {
			const overlap = topBridge.skill_overlap.overlap_percentage.toFixed(0);
			const lift = topBridge.wage_lift.absolute_lift_inr;
			if (lift && lift > 0) extraContextEn = ` You already have ${overlap}% of the needed skills, with an estimated earnings lift of ₹${lift.toLocaleString("en-IN")} a month.`;
			else extraContextEn = ` You already have ${overlap}% of the needed skills.`;
		}
		const msg = this.getLocalizedText({
			en: `I found some career options for you. One promising option is ${skillName}.${extraContextEn} Would you like to know about the course?`,
			kn: `ನಾನು ನಿಮಗಾಗಿ ಉತ್ತಮ ವೃತ್ತಿ ಆಯ್ಕೆಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ಒಂದು ಆಯ್ಕೆ ${skillName}. ಕೋರ್ಸ್ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?`,
			hi: `मुझे आपके लिए करियर के विकल्प मिले हैं। एक विकल्प ${skillName} है। क्या आप पाठ्यक्रम के बारे में जानना चाहते हैं?`
		});
		this.speakAndRecord(msg, "PROGRESSIVE_OVERVIEW", ["Yes, Tell Me About Course", "No, Next Option"]);
	}
	handleProgressiveNext(nextStep, userResponse) {
		const rec = this.state.recommendation;
		if (!rec) return;
		const lower = userResponse.toLowerCase();
		if (!(this.isAffirmative(userResponse) || lower.includes("tell") || lower.includes("yes")) && !lower.includes("next")) {
			this.concludeProgressive();
			return;
		}
		if (nextStep === "PROGRESSIVE_COURSE") {
			const courses = rec.courses || [];
			if (courses.length > 0) {
				const c = courses[0];
				const dur = c.duration_value && c.duration_unit ? `${c.duration_value} ${c.duration_unit}` : "standard duration";
				const msg = this.getLocalizedText({
					en: `The course is ${c.title}, which takes about ${dur}. Would you like to know where you can learn it near you?`,
					kn: `ಈ ಕೋರ್ಸ್ ${c.title}, ಇದು ಸುಮಾರು ${dur} ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ. ನಿಮ್ಮ ಹತ್ತಿರ ಎಲ್ಲಿ ಕಲಿಯಬಹುದು ಎಂದು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?`,
					hi: `यह पाठ्यक्रम ${c.title} है, जिसमें लगभग ${dur} लगता है। क्या आप जानना चाहते हैं कि इसे अपने पास कहाँ सीख सकते हैं?`
				});
				this.speakAndRecord(msg, "PROGRESSIVE_COURSE", ["Yes, Find Centres", "Skip"]);
			} else this.handleProgressiveNext("PROGRESSIVE_CENTRE", "yes");
		} else if (nextStep === "PROGRESSIVE_CENTRE") {
			const centres = rec.nearby_centres || [];
			if (centres.length > 0) {
				const centre = centres[0];
				let distancePhrase = "";
				if (centre.distance_km != null) distancePhrase = this.getLocalizedText({
					en: `The centre is about ${centre.distance_km.toFixed(1)} kilometres away.`,
					kn: `ಈ ಕೇಂದ್ರ ಸುಮಾರು ${centre.distance_km.toFixed(1)} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.`,
					hi: `यह केंद्र लगभग ${centre.distance_km.toFixed(1)} किलोमीटर दूर है।`
				});
				else distancePhrase = this.getLocalizedText({
					en: `I found a centre in ${centre.district || this.state.profile.district}, but I don't have a verified distance.`,
					kn: `ನಾನು ${centre.district || this.state.profile.district} ನಲ್ಲಿ ಕೇಂದ್ರ ಕಂಡುಕೊಂಡಿದ್ದೇನೆ, ಆದರೆ ಪರಿಶೀಲಿಸಿದ ದೂರ ಲಭ್ಯವಿಲ್ಲ.`,
					hi: `मुझे ${centre.district || this.state.profile.district} में एक केंद्र मिला है, लेकिन सटीक दूरी उपलब्ध नहीं है।`
				});
				const msg = `You can train at ${centre.name}. ${distancePhrase} ` + this.getLocalizedText({
					en: "Would you like to know about government financial support?",
					kn: "ಸರ್ಕಾರಿ ಆರ್ಥಿಕ ನೆರವಿನ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?",
					hi: "क्या आप सरकारी सहायता के बारे में जानना चाहते हैं?"
				});
				this.speakAndRecord(msg, "PROGRESSIVE_CENTRE", ["Yes, Tell Me Schemes", "Skip"]);
			} else {
				const noCentreMsg = this.getLocalizedText({
					en: `I found no active training centres listed in ${this.state.profile.district} currently. Would you like to check government support?`,
					kn: `ಪ್ರಸ್ತುತ ${this.state.profile.district} ನಲ್ಲಿ ಸಕ್ರಿಯ ತರಬೇತಿ ಕೇಂದ್ರಗಳಿಲ್ಲ. ಸರ್ಕಾರಿ ನೆರವು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?`,
					hi: `वर्तमान में ${this.state.profile.district} में कोई सक्रिय केंद्र नहीं मिला। क्या सरकारी सहायता देखना चाहते हैं?`
				});
				this.speakAndRecord(noCentreMsg, "PROGRESSIVE_CENTRE", ["Yes, Check Schemes", "Skip"]);
			}
		} else if (nextStep === "PROGRESSIVE_SCHEME") {
			const eligibilityList = rec.eligibility || [];
			const anyScheme = eligibilityList.find((e) => e.verdict === "eligible") || eligibilityList[0];
			if (anyScheme) {
				let statusPhrase = "";
				if (anyScheme.verdict === "eligible") statusPhrase = this.getLocalizedText({
					en: `Under ${anyScheme.scheme_name}, you may be eligible for support.`,
					kn: `${anyScheme.scheme_name} ಅಡಿಯಲ್ಲಿ, ನೀವು ನೆರವಿಗೆ ಅರ್ಹರಾಗಿರಬಹುದು.`,
					hi: `${anyScheme.scheme_name} के तहत आप सहायता के लिए पात्र हो सकते हैं।`
				});
				else if (anyScheme.verdict === "not_eligible") statusPhrase = this.getLocalizedText({
					en: `Based on available criteria, you are not currently eligible for ${anyScheme.scheme_name}.`,
					kn: `ಲಭ್ಯವಿರುವ ಮಾನದಂಡಗಳ ಆಧಾರದ ಮೇಲೆ, ನೀವು ಪ್ರಸ್ತುತ ${anyScheme.scheme_name} ಗೆ ಅರ್ಹರಲ್ಲ.`,
					hi: `उपलब्ध जानकारी के अनुसार, आप अभी ${anyScheme.scheme_name} के पात्र नहीं हैं।`
				});
				else statusPhrase = this.getLocalizedText({
					en: `For ${anyScheme.scheme_name}, eligibility requires more information.`,
					kn: `${anyScheme.scheme_name} ಗಾಗಿ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ.`,
					hi: `${anyScheme.scheme_name} के लिए अतिरिक्त जानकारी आवश्यक है।`
				});
				const msg = `${statusPhrase} ` + this.getLocalizedText({
					en: "Would you like to know what to do next?",
					kn: "ಮುಂದೆ ಏನು ಮಾಡಬೇಕೆಂದು ತಿಳಿಯಲು ಬಯಸುವಿರಾ?",
					hi: "क्या आप जानना चाहते हैं कि आगे क्या करना है?"
				});
				this.speakAndRecord(msg, "PROGRESSIVE_SCHEME", ["Yes, Next Steps", "Done"]);
			} else this.handleProgressiveNext("PROGRESSIVE_NEXT_STEPS", "yes");
		} else if (nextStep === "PROGRESSIVE_NEXT_STEPS") {
			const stepSummary = (rec.explanation?.next_steps || ["Visit the training centre with your identification documents.", "Apply for admission during the upcoming batch intake."]).slice(0, 2).join(" ");
			const msg = this.getLocalizedText({
				en: `Here is what to do next: ${stepSummary} You can also review all details visually on your screen.`,
				kn: `ಮುಂದಿನ ಹಂತ: ${stepSummary} ನೀವು ನಿಮ್ಮ ಪರದೆಯ ಮೇಲೆ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಸಹ ನೋಡಬಹುದು.`,
				hi: `आगे का कदम: ${stepSummary} आप अपनी स्क्रीन पर भी सभी विवरण देख सकते हैं।`
			});
			this.speakAndRecord(msg, "PROGRESSIVE_NEXT_STEPS", ["Start Over", "Close Voice"]);
		}
	}
	concludeProgressive() {
		const msg = this.getLocalizedText({
			en: "You can see the complete recommendations, training centres, and documents on your screen.",
			kn: "ನಿಮ್ಮ ಪರದೆಯ ಮೇಲೆ ನೀವು ಸಂಪೂರ್ಣ ಶಿಫಾರಸುಗಳು, ಕೇಂದ್ರಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ನೋಡಬಹುದು.",
			hi: "आप अपनी स्क्रीन पर पूरी सिफारिशें, केंद्र और आवश्यक दस्तावेज देख सकते हैं।"
		});
		this.speakAndRecord(msg, "COMPLETED", ["Start Over", "Close Voice"]);
	}
	handleGoBack() {
		switch (this.state.dialogueStep) {
			case "OCCUPATION_CONFIRM":
				this.askOccupation();
				break;
			case "GOAL":
			case "GOAL_CONFIRM":
				this.handleOccupationInput(this.state.profile.occupation);
				break;
			case "DISTRICT":
			case "DISTRICT_CONFIRM":
				const goalPrompt = this.getLocalizedText({
					en: "What would you like to learn or do?",
					kn: "ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಅಥವಾ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
					hi: "आप क्या सीखना या करना चाहते हैं?"
				});
				this.speakAndRecord(goalPrompt, "GOAL", [
					"Electrician",
					"EV Service Technician",
					"I don't know"
				]);
				break;
			case "REVIEW":
				const distPrompt = this.getLocalizedText({
					en: "Which district in Karnataka are you in?",
					kn: "ನೀವು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿದ್ದೀರಿ?",
					hi: "आप किस जिले में हैं?"
				});
				this.speakAndRecord(distPrompt, "DISTRICT", [
					"Bengaluru Urban",
					"Mysuru",
					"Belagavi"
				]);
				break;
			default: this.startConversation();
		}
	}
	handleSimplify() {
		const simple = this.getLocalizedText({
			en: "In simple words: We help you find a course to earn more, a school near you, and government help to pay for it.",
			kn: "ಸರಳವಾಗಿ ಹೇಳುವುದಾದರೆ: ಹೆಚ್ಚು ಸಂಪಾದಿಸಲು ಕೋರ್ಸ್, ಹತ್ತಿರದ ಶಾಲೆ ಮತ್ತು ಸರ್ಕಾರಿ ನೆರವು ಹುಡುಕಲು ನಾವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇವೆ.",
			hi: "आसान शब्दों में: हम आपको बेहतर कमाई के लिए कोर्स, नजदीकी केंद्र और सरकारी सहायता खोजने में मदद करते हैं।"
		});
		this.speakAndRecord(simple, this.state.dialogueStep, this.state.quickReplies);
	}
	speakAndRecord(text, nextStep, quickReplies = []) {
		this.state.dialogueStep = nextStep;
		this.state.quickReplies = quickReplies;
		this.state.lastAssistantSpeech = text;
		this.state.messages.push({
			id: `msg_a_${Date.now()}`,
			sender: "assistant",
			text,
			timestamp: Date.now()
		});
		this.state.voiceState = "SPEAKING";
		this.notify();
		this.speak(text, () => {
			this.state.voiceState = "IDLE";
			this.notify();
		});
	}
	async speak(text, onEnd) {
		if (typeof window === "undefined") {
			if (onEnd) onEnd();
			return;
		}
		try {
			const res = await fetch("/api/voice/synthesize", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text,
					language: this.language,
					session_id: this.state.profile.session_id
				})
			});
			if (res.ok) {
				const data = await res.json();
				if (data.audio_base64) {
					const audio = new Audio(`data:audio/${data.audio_format || "wav"};base64,${data.audio_base64}`);
					this.currentAudioElement = audio;
					this.isSynthesisSpeaking = true;
					audio.onended = () => {
						this.isSynthesisSpeaking = false;
						this.currentAudioElement = null;
						if (onEnd) onEnd();
					};
					audio.onerror = () => {
						this.isSynthesisSpeaking = false;
						this.currentAudioElement = null;
						if (onEnd) onEnd();
					};
					await audio.play();
					return;
				}
			}
		} catch (err) {}
		if (window.speechSynthesis) try {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(text);
			utterance.lang = {
				en: "en-IN",
				kn: "kn-IN",
				hi: "hi-IN"
			}[this.language] || "en-IN";
			utterance.rate = .95;
			this.isSynthesisSpeaking = true;
			utterance.onend = () => {
				this.isSynthesisSpeaking = false;
				if (onEnd) onEnd();
			};
			utterance.onerror = () => {
				this.isSynthesisSpeaking = false;
				if (onEnd) onEnd();
			};
			window.speechSynthesis.speak(utterance);
			return;
		} catch (e) {
			this.isSynthesisSpeaking = false;
		}
		if (onEnd) onEnd();
	}
	isAffirmative(text) {
		const t = text.toLowerCase().trim();
		return t === "yes" || t === "ha" || t === "haan" || t === "sari" || t === "houdu" || t === "correct" || t === "right" || t === "sahi hai" || t === "theek hai" || t === "ಹೌದು" || t === "ಸರಿ" || t === "हाँ" || t.startsWith("yes") || t.includes("correct") || t.includes("right");
	}
	isDontKnow(text) {
		const t = text.toLowerCase().trim();
		return t.includes("don't know") || t.includes("dont know") || t.includes("not sure") || t.includes("you tell me") || t.includes("suggest me") || t.includes("what should i learn") || t.includes("gottilla") || t.includes("ಗೊತ್ತಿಲ್ಲ") || t.includes("ಯಾವುದಾದರೂ") || t.includes("nahi pata") || t.includes("pata nahi") || t.includes("पता नहीं") || t.includes("मुझे नहीं पता");
	}
	normalizeOccupation(text) {
		const t = text.toLowerCase();
		if (t.includes("deliver") || t.includes("courier") || t.includes("rider") || t.includes("swiggy") || t.includes("zomato")) return "Delivery / Courier Rider";
		if (t.includes("auto") || t.includes("rickshaw") || t.includes("driver")) return "Auto Rickshaw Driver";
		if (t.includes("construct") || t.includes("labour") || t.includes("mason") || t.includes("building") || t.includes("helper")) return "Construction Labourer";
		if (t.includes("domestic") || t.includes("house") || t.includes("maid") || t.includes("clean") || t.includes("home work")) return "Domestic Worker";
		if (t.includes("vendor") || t.includes("market") || t.includes("shop") || t.includes("vegetable") || t.includes("sell")) return "Street / Market Vendor";
		if (t.includes("tailor") || t.includes("garment") || t.includes("sewing") || t.includes("stitch")) return "Tailor / Garment Worker";
		if (t.includes("electric") || t.includes("wire")) return "Electrician";
		if (t.includes("mechanic") || t.includes("garage") || t.includes("bike repair")) return "Automotive Mechanic";
		return text.trim().replace(/^(i work as a|i am a|i do|i work as)\s+/i, "");
	}
	normalizeGoal(text) {
		const t = text.toLowerCase();
		if (t.includes("electrician") || t.includes("electrical") || t.includes("wiring")) return "Electrician";
		if (t.includes("ev") || t.includes("electric vehicle") || t.includes("battery")) return "EV Service Technician";
		if (t.includes("fitter") || t.includes("pipe") || t.includes("plumbing")) return "Construction Fitter";
		if (t.includes("health") || t.includes("nurse") || t.includes("hospital") || t.includes("assistant")) return "General Duty Assistant";
		if (t.includes("mechanic") || t.includes("motor")) return "Motor Vehicle Mechanic";
		return text.trim().replace(/^(i want to learn|i want to become|i want to do)\s+/i, "");
	}
	findMatchingDistrict(text) {
		const t = text.toLowerCase().trim();
		for (const dist of KARNATAKA_DISTRICTS) if (t.includes(dist.toLowerCase())) return dist;
		if (t.includes("bangalore") || t.includes("bengaluru")) return "Bengaluru Urban";
		if (t.includes("mysore") || t.includes("mysuru")) return "Mysuru";
		if (t.includes("belgaum") || t.includes("belagavi")) return "Belagavi";
		if (t.includes("mangalore") || t.includes("dakshina")) return "Dakshina Kannada";
		if (t.includes("hubli") || t.includes("dharwad")) return "Dharwad";
		if (t.includes("gulbarga") || t.includes("kalaburagi")) return "Kalaburagi";
		return text.trim() || "Bengaluru Urban";
	}
	getLocalizedText(translations) {
		return translations[this.language] || translations["en"];
	}
};
//#endregion
//#region tests/voice_assistant.test.ts
test("1. Initial state has safe defaults and strictly null coordinates", () => {
	const state = new VoiceAssistantService("en").getState();
	assert.equal(state.voiceState, "IDLE");
	assert.equal(state.dialogueStep, "WELCOME");
	assert.equal(state.profile.latitude, null, "Latitude must strictly be null");
	assert.equal(state.profile.longitude, null, "Longitude must strictly be null");
	assert.ok(state.profile.session_id, "Session ID must be generated");
});
test("2. Step-by-step dialogue progression: Delivery Rider Scenario", async () => {
	const service = new VoiceAssistantService("en");
	service.startConversation();
	let state = service.getState();
	assert.equal(state.dialogueStep, "OCCUPATION");
	await service.handleUserInput("I work as a delivery rider");
	state = service.getState();
	assert.equal(state.dialogueStep, "OCCUPATION_CONFIRM");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /delivery.*rider/);
	await service.handleUserInput("Yes");
	state = service.getState();
	assert.equal(state.dialogueStep, "GOAL");
	assert.match(state.profile.occupation.toLowerCase(), /delivery/);
	await service.handleUserInput("I want to learn electrician work");
	state = service.getState();
	assert.equal(state.dialogueStep, "GOAL_CONFIRM");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /electrician/);
	await service.handleUserInput("Yes");
	state = service.getState();
	assert.equal(state.dialogueStep, "DISTRICT");
	assert.match(state.profile.career_goal_text.toLowerCase(), /electrician/);
	await service.handleUserInput("Bengaluru Urban");
	state = service.getState();
	assert.equal(state.dialogueStep, "DISTRICT_CONFIRM");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /bengaluru urban/);
	await service.handleUserInput("Yes");
	state = service.getState();
	assert.equal(state.dialogueStep, "REVIEW");
	assert.equal(state.profile.district, "Bengaluru Urban");
	assert.equal(state.profile.latitude, null);
	assert.equal(state.profile.longitude, null);
});
test("3. \"I don't know\" handling: Auto Driver Scenario", async () => {
	const service = new VoiceAssistantService("en");
	service.startConversation();
	await service.handleUserInput("I drive an auto");
	await service.handleUserInput("Yes");
	let state = service.getState();
	assert.equal(state.dialogueStep, "GOAL");
	await service.handleUserInput("I don't know what to learn");
	state = service.getState();
	assert.equal(state.dialogueStep, "DISTRICT");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /that's okay|suggest options/);
	assert.ok(state.profile.career_goal_text.length > 0);
});
test("4. Language switching preserves profile and session ID", async () => {
	const service = new VoiceAssistantService("en", {
		occupation: "Domestic Worker",
		session_id: "test-sess-preserve-1"
	});
	let state = service.getState();
	assert.equal(service.getLanguage(), "en");
	assert.equal(state.profile.occupation, "Domestic Worker");
	assert.equal(state.profile.session_id, "test-sess-preserve-1");
	await service.handleUserInput("Speak Kannada");
	state = service.getState();
	assert.equal(service.getLanguage(), "kn");
	assert.equal(state.profile.occupation, "Domestic Worker", "Occupation must be preserved across language switch");
	assert.equal(state.profile.session_id, "test-sess-preserve-1", "Session ID must be preserved");
	await service.handleUserInput("Speak English");
	state = service.getState();
	assert.equal(service.getLanguage(), "en");
	assert.equal(state.profile.occupation, "Domestic Worker");
});
test("5. Go back and correction handling", async () => {
	const service = new VoiceAssistantService("en");
	service.startConversation();
	await service.handleUserInput("Auto driver");
	let state = service.getState();
	assert.equal(state.dialogueStep, "OCCUPATION_CONFIRM");
	await service.handleUserInput("No");
	state = service.getState();
	assert.equal(state.dialogueStep, "OCCUPATION", "Should return to occupation prompt on negation");
	await service.handleUserInput("Delivery rider");
	state = service.getState();
	assert.equal(state.dialogueStep, "OCCUPATION_CONFIRM");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /delivery.*rider/);
	await service.handleUserInput("Go back");
	state = service.getState();
	assert.equal(state.dialogueStep, "OCCUPATION");
});
test("6. Stop / Exit command pauses gracefully", async () => {
	const service = new VoiceAssistantService("en");
	service.startConversation();
	await service.handleUserInput("Stop");
	const state = service.getState();
	assert.equal(state.dialogueStep, "STOPPED");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /pause|ready/);
});
test("7. Progressive recommendation explanation walkthrough", async () => {
	const service = new VoiceAssistantService("en");
	const demoRec = DEMO_SCENARIOS.find((s) => s.id === "delivery-to-electrician").response;
	service.startProgressiveExplanation(demoRec);
	let state = service.getState();
	assert.equal(state.dialogueStep, "PROGRESSIVE_OVERVIEW");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /electrician/);
	await service.handleUserInput("Yes, tell me about course");
	state = service.getState();
	assert.equal(state.dialogueStep, "PROGRESSIVE_COURSE");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /course/);
	await service.handleUserInput("Yes");
	state = service.getState();
	assert.equal(state.dialogueStep, "PROGRESSIVE_CENTRE");
	assert.match(state.lastAssistantSpeech.toLowerCase(), /train|centre/);
	await service.handleUserInput("Yes");
	state = service.getState();
	assert.equal(state.dialogueStep, "PROGRESSIVE_SCHEME");
	await service.handleUserInput("Yes");
	state = service.getState();
	assert.equal(state.dialogueStep, "PROGRESSIVE_NEXT_STEPS");
});
//#endregion
//#region tests/skill_uplift.test.ts
test("Skill Uplift Pipeline — Scenario Mock Data Verification", async (t) => {
	await t.test("All 4 demo scenarios have valid skill_bridge populated", () => {
		assert.equal(DEMO_SCENARIOS.length, 4, "Should have exactly 4 demo scenarios");
		for (const scenario of DEMO_SCENARIOS) {
			assert.ok(scenario.response.skill_bridge, `Scenario ${scenario.id} must have skill_bridge defined`);
			const bridge = scenario.response.skill_bridge;
			assert.ok(Array.isArray(bridge.pathways), `Scenario ${scenario.id} pathways must be an array`);
			assert.ok(bridge.pathways.length >= 1, `Scenario ${scenario.id} must have at least 1 pathway`);
		}
	});
	await t.test("Primary pathways contain all 12-step pipeline attributes", () => {
		for (const scenario of DEMO_SCENARIOS) {
			const pathway = scenario.response.skill_bridge.pathways[0];
			assert.ok(pathway.transition_id, "Must have transition_id");
			assert.ok(pathway.target_skill?.name_en, "Must have target_skill");
			assert.ok(pathway.skill_overlap, "Must have skill_overlap");
			assert.ok(pathway.skill_overlap.overlap_percentage >= 0, "Overlap percentage must be valid");
			assert.ok(Array.isArray(pathway.skill_gaps), "Must have skill_gaps array");
			assert.ok(Array.isArray(pathway.courses), "Must have courses array");
			assert.ok(Array.isArray(pathway.nearby_centres), "Must have nearby_centres array");
			assert.ok(pathway.scheme, "Must have scheme");
			assert.ok(pathway.eligibility, "Must have eligibility");
			assert.ok(pathway.certification_status, "Must have certification_status");
			assert.ok(pathway.wage_lift, "Must have wage_lift");
			assert.ok(pathway.pathway_score, "Must have pathway_score");
			assert.ok(pathway.next_action, "Must have next_action");
		}
	});
	await t.test("Wage lift numbers strictly align with hackathon benchmark values", () => {
		const delivery = DEMO_SCENARIOS.find((s) => s.id === "delivery-to-electrician");
		const domestic = DEMO_SCENARIOS.find((s) => s.id === "domestic-worker-to-tailoring");
		const construction = DEMO_SCENARIOS.find((s) => s.id === "construction-to-fitter");
		const auto = DEMO_SCENARIOS.find((s) => s.id === "autorickshaw-to-ev");
		const pDelivery = delivery.response.skill_bridge.pathways[0];
		assert.equal(pDelivery.wage_lift.current?.monthly_wage_inr, 18e3);
		assert.equal(pDelivery.wage_lift.target?.monthly_wage_inr, 3e4);
		assert.equal(pDelivery.wage_lift.absolute_difference_inr, 12e3);
		assert.equal(pDelivery.wage_lift.percentage_difference, 66.7);
		assert.equal(pDelivery.wage_lift.data_status, "mock");
		const pDomestic = domestic.response.skill_bridge.pathways[0];
		assert.equal(pDomestic.wage_lift.current?.monthly_wage_inr, 8e3);
		assert.equal(pDomestic.wage_lift.target?.monthly_wage_inr, 16e3);
		assert.equal(pDomestic.wage_lift.absolute_difference_inr, 8e3);
		assert.equal(pDomestic.wage_lift.percentage_difference, 100);
		assert.equal(pDomestic.wage_lift.data_status, "mock");
		const pConstruction = construction.response.skill_bridge.pathways[0];
		assert.equal(pConstruction.wage_lift.current?.monthly_wage_inr, 12e3);
		assert.equal(pConstruction.wage_lift.target?.monthly_wage_inr, 29e3);
		assert.equal(pConstruction.wage_lift.absolute_difference_inr, 17e3);
		assert.equal(pConstruction.wage_lift.percentage_difference, 141.7);
		assert.equal(pConstruction.wage_lift.data_status, "mock");
		const pAuto = auto.response.skill_bridge.pathways[0];
		assert.equal(pAuto.wage_lift.current?.monthly_wage_inr, 18e3);
		assert.equal(pAuto.wage_lift.target?.monthly_wage_inr, 32e3);
		assert.equal(pAuto.wage_lift.absolute_difference_inr, 14e3);
		assert.equal(pAuto.wage_lift.percentage_difference, 77.8);
		assert.equal(pAuto.wage_lift.data_status, "mock");
	});
	await t.test("All pathways carry mandatory illustrative disclaimer", () => {
		for (const scenario of DEMO_SCENARIOS) for (const pathway of scenario.response.skill_bridge.pathways) assert.ok(pathway.wage_lift.disclaimer && pathway.wage_lift.disclaimer.length > 10, "Must have descriptive wage disclaimer");
	});
});
//#endregion
export {};
