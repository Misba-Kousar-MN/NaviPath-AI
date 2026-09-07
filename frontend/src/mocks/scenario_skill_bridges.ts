import { SkillBridgeResult } from '../types/recommendation';

export const deliverySkillBridge: SkillBridgeResult = {
  current_occupation: {
    id: 'occ-001',
    name_en: 'Delivery / Courier Rider',
    name_kn: 'ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್',
    name_hi: 'डिलीवरी / कूरियर राइडर',
    sector: 'Logistics & Gig Economy',
    nco_code: '8322.0401',
    is_informal_sector: true,
    description: 'Two-wheeler parcel/food delivery executive in urban centres.'
  },
  current_skills: [
    {
      id: 'skl-001',
      name_en: 'Two-Wheeler Driving & Route Navigation',
      name_kn: 'ದ್ವಿಚಕ್ರ ವಾಹನ ಚಾಲನೆ ಮತ್ತು ನ್ಯಾವಿಗೇಷನ್',
      category: 'Operational',
      skill_level: 'Level 2'
    },
    {
      id: 'skl-002',
      name_en: 'Customer Interaction & Mobile App Literacy',
      name_kn: 'ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ',
      category: 'Service',
      skill_level: 'Level 2'
    }
  ],
  warnings: [],
  pathways: [
    {
      transition_id: 'trans-001-primary',
      pathway_type: 'bridge',
      confidence: 'expert-curated',
      confidence_note: 'High-feasibility trade transition; logistics mobile app literacy and navigation transfer directly to on-site domestic electrical maintenance visits.',
      current_occupation: {
        id: 'occ-001',
        name_en: 'Delivery / Courier Rider',
        name_kn: 'ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್',
        name_hi: 'डिलीवरी / कूरियर राइडर',
        sector: 'Logistics & Gig Economy',
        nco_code: '8322.0401',
        is_informal_sector: true,
        description: 'Two-wheeler parcel/food delivery executive in urban centres.'
      },
      target_occupation: {
        id: 'occ-010',
        name_en: 'Electrician (Domestic / Installation)',
        name_kn: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)',
        name_hi: 'इलेक्ट्रीशियन (घरेलू / वायरिंग)',
        sector: 'Technical Trades & Construction',
        nco_code: '7411.0100',
        is_informal_sector: false,
        description: 'Certified domestic wireman and electrical equipment installer.'
      },
      target_skill: {
        id: 'skl-004',
        name_en: 'Electrician (Domestic / Installation)',
        name_kn: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)',
        name_hi: 'इलेक्ट्रीशियन (घरेलू / वायरिंग)',
        category: 'Technical Trades',
        skill_level: 'Level 3',
        is_certifiable: true,
        certifying_body: 'NCVT / DGT'
      },
      current_skills: [
        {
          id: 'skl-001',
          name_en: 'Two-Wheeler Driving & Route Navigation',
          name_kn: 'ದ್ವಿಚಕ್ರ ವಾಹನ ಚಾಲನೆ ಮತ್ತು ನ್ಯಾವಿಗೇಷನ್',
          category: 'Operational',
          skill_level: 'Level 2'
        },
        {
          id: 'skl-002',
          name_en: 'Customer Interaction & Mobile App Literacy',
          name_kn: 'ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ',
          category: 'Service',
          skill_level: 'Level 2'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-002'],
        overlap_skills: [
          {
            id: 'skl-002',
            name_en: 'Customer Interaction & Mobile App Literacy',
            name_kn: 'ಗ್ರಾಹಕರ ಸಂಪರ್ಕ ಮತ್ತು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಕೆ',
            category: 'Service',
            skill_level: 'Level 2'
          }
        ],
        target_skill_ids: ['skl-004', 'skl-005'],
        target_skills: [
          {
            id: 'skl-004',
            name_en: 'Electrician (Domestic / Installation)',
            name_kn: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)',
            category: 'Technical Trades',
            skill_level: 'Level 3'
          },
          {
            id: 'skl-005',
            name_en: 'Basic Electrical Safety & Hand Tools',
            name_kn: 'ಮೂಲ ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣಗಳ ಬಳಕೆ',
            category: 'Foundational Technical',
            skill_level: 'Level 2'
          }
        ],
        overlap_count: 1,
        total_target_skills: 2,
        overlap_percentage: 50.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-004',
          skill_name: 'Domestic Wiring & Circuit Installation',
          skill_category: 'Technical Trades',
          gap_type: 'target',
          rationale: 'Required for certified wireman license and residential installation work.',
          has_it: false,
          how_to_close: 'Complete Domestic Solutions Electrician Course (crs-002)'
        },
        {
          skill_id: 'skl-005',
          skill_name: 'Electrical Safety & PPE Compliance',
          skill_category: 'Foundational Technical',
          gap_type: 'bridge',
          rationale: 'Prerequisite safety training for live wire diagnostics.',
          has_it: false,
          how_to_close: 'Safety module included in CMKKY induction'
        }
      ],
      bridge_skills: [
        {
          id: 'skl-005',
          name_en: 'Basic Electrical Safety & Hand Tools',
          name_kn: 'ಮೂಲ ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣಗಳ ಬಳಕೆ',
          category: 'Foundational Technical',
          skill_level: 'Level 2'
        }
      ],
      courses: [
        {
          id: 'crs-002',
          title: 'Domestic Solutions Electrician (NSQF Level 3)',
          skill_id: 'skl-004',
          level: 'NSQF Level 3',
          duration_value: 350,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'NCVT / Directorate General of Training (DGT)',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-001',
          provider: 'Government Industrial Training Institute (ITI) Bengaluru'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-001',
          name: 'Government Industrial Training Institute (ITI) Bengaluru Urban',
          district: 'Bengaluru Urban',
          taluk: 'Bengaluru North',
          address: 'Dairy Circle, Bannerghatta Road, Bengaluru, Karnataka 560029',
          latitude: 12.9345,
          longitude: 77.5982,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 80 2225 1234',
          distance_km: 4.2,
          distance_type: 'exact'
        }
      ],
      scheme: {
        id: 'sch-001',
        name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
        name_kn: 'ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ',
        name_hi: 'मुख्यमंत्री कौशल्य कर्नाटक योजना',
        issuing_authority: 'Karnataka Skill Development Corporation (KSDC)',
        scheme_type: 'State Vocational Training Subsidy',
        benefit_summary: '100% free technical skill training, assessment, and NCVT certification with travel allowance support.',
        official_url: 'https://kaushalkar.karnataka.gov.in',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-001',
        scheme_name: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-01',
            description: 'Resident of Karnataka (Bengaluru Urban profile match)',
            passed: true,
            result: 'pass',
            detail: 'Bengaluru Urban resident'
          },
          {
            rule_id: 'rule-02',
            description: 'Age between 18 and 35 years (Age 26 meets criteria)',
            passed: true,
            result: 'pass',
            detail: 'Age 26'
          },
          {
            rule_id: 'rule-03',
            description: 'Minimum educational qualification 10th pass satisfied',
            passed: true,
            result: 'pass',
            detail: '10th Pass'
          }
        ],
        disclaimer: 'Official document verification required at enrolment centre.'
      },
      certification_status: 'Government Recognized — NCVT / DGT Level 3',
      wage_lift: {
        current: { occupation: 'Delivery / Courier Rider', monthly_wage_inr: 18000, status: 'benchmark' },
        target: { occupation: 'Electrician (Domestic / Installation)', monthly_wage_inr: 30000, status: 'benchmark' },
        current_benchmark: {
          benchmark_id: 'bmk-gig-01',
          occupation_name: 'Delivery / Courier Rider',
          employment_type: 'Gig / Platform Worker',
          wage_type: 'earning',
          monthly_median_inr: 18000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Bengaluru Urban',
          source_id: 'src-mock-01',
          source_title: 'Karnataka Gig Worker Survey 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        target_benchmark: {
          benchmark_id: 'bmk-elec-01',
          occupation_name: 'Electrician (Domestic / Installation)',
          employment_type: 'Skilled Tradesperson',
          wage_type: 'salary',
          monthly_median_inr: 30000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Bengaluru Urban',
          source_id: 'src-mock-01',
          source_title: 'Karnataka Skill Council Benchmark 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        absolute_lift_inr: 12000,
        percentage_lift: 66.7,
        absolute_difference_inr: 12000,
        percentage_difference: 66.7,
        available: true,
        data_status: 'mock',
        source_label: 'Karnataka State Wage Survey & Industry Benchmarks 2024 (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 82,
        label: 'Strong',
        overlap_component: 20,
        gap_component: 20,
        transition_component: 22,
        training_component: 10,
        centre_component: 10,
        explanation: 'High urban demand for domestic electrical repairs in Bengaluru; strong synergy with route navigation and customer visit workflows.'
      },
      rationale: 'High urban demand for domestic electrical repairs; your mobile navigation and customer handling transfer well into on-site service visits; foundational safety training enables swift entry.',
      market_demand_note: 'High demand across residential complexes and smart city electrification in Bengaluru Urban.',
      next_action: 'Enroll in the 350-hour Domestic Solutions Electrician course at Government ITI Bengaluru (Majestic) under the free CMKKY scheme.'
    },
    {
      transition_id: 'trans-001-alt',
      pathway_type: 'bridge',
      confidence: 'data-driven',
      confidence_note: 'Clean-energy alternative pathway with booming solar rooftop installations across Karnataka.',
      current_occupation: {
        id: 'occ-001',
        name_en: 'Delivery / Courier Rider',
        name_kn: 'ಡೆಲಿವರಿ / ಕೊರಿಯರ್ ರೈಡರ್',
        name_hi: 'डिलीवरी / कूरियर राइडर',
        sector: 'Logistics & Gig Economy',
        nco_code: '8322.0401',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-011',
        name_en: 'Solar PV Rooftop Technician',
        name_kn: 'ಸೌರ ಫಲಕ ಅಳವಡಿಕೆ ತಂತ್ರಜ್ಞ',
        sector: 'Renewable Energy',
        nco_code: '7421.0300'
      },
      target_skill: {
        id: 'skl-006',
        name_en: 'Solar Rooftop Installation & Inverter Wiring',
        category: 'Renewable Energy',
        skill_level: 'Level 3'
      },
      current_skills: [
        {
          id: 'skl-001',
          name_en: 'Two-Wheeler Driving & Route Navigation',
          category: 'Operational',
          skill_level: 'Level 2'
        },
        {
          id: 'skl-002',
          name_en: 'Customer Interaction & Mobile App Literacy',
          category: 'Service',
          skill_level: 'Level 2'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-001'],
        overlap_skills: [
          {
            id: 'skl-001',
            name_en: 'Two-Wheeler Driving & Route Navigation',
            category: 'Operational',
            skill_level: 'Level 2'
          }
        ],
        target_skill_ids: ['skl-006', 'skl-005'],
        target_skills: [
          {
            id: 'skl-006',
            name_en: 'Solar Rooftop Installation & Inverter Wiring',
            category: 'Renewable Energy',
            skill_level: 'Level 3'
          },
          {
            id: 'skl-005',
            name_en: 'Basic Electrical Safety & Hand Tools',
            category: 'Foundational Technical',
            skill_level: 'Level 2'
          }
        ],
        overlap_count: 1,
        total_target_skills: 2,
        overlap_percentage: 50.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-006',
          skill_name: 'Photovoltaic Array Alignment & Inverter Safety',
          skill_category: 'Renewable Energy',
          gap_type: 'target',
          rationale: 'Required for grid-tied rooftop solar panel assembly and DC cabling.',
          has_it: false,
          how_to_close: 'Complete Suryamitra Solar PV Technician module'
        }
      ],
      bridge_skills: [
        {
          id: 'skl-005',
          name_en: 'Basic Electrical Safety & Hand Tools',
          category: 'Foundational Technical',
          skill_level: 'Level 2'
        }
      ],
      courses: [
        {
          id: 'crs-002-alt',
          title: 'Suryamitra Solar PV Technician (NSQF Level 4)',
          skill_id: 'skl-006',
          level: 'NSQF Level 4',
          duration_value: 300,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'Skill Council for Green Jobs (SCGJ)',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-001',
          provider: 'National Institute of Solar Energy / KREDL'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-001',
          name: 'Government Industrial Training Institute (ITI) Bengaluru Urban',
          district: 'Bengaluru Urban',
          taluk: 'Bengaluru North',
          address: 'Dairy Circle, Bannerghatta Road, Bengaluru, Karnataka 560029',
          distance_km: 4.2,
          distance_type: 'exact'
        }
      ],
      scheme: {
        id: 'sch-001',
        name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
        issuing_authority: 'Karnataka Skill Development Corporation (KSDC)',
        scheme_type: 'Renewable Skilling Initiative',
        benefit_summary: '100% free green skill training with solar industry placement drive.',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-001',
        scheme_name: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-01',
            description: 'Resident of Karnataka',
            passed: true,
            result: 'pass'
          }
        ]
      },
      certification_status: 'Government Recognized — MNRE Suryamitra / NCVT',
      wage_lift: {
        current: { occupation: 'Delivery / Courier Rider', monthly_wage_inr: 18000, status: 'benchmark' },
        target: { occupation: 'Solar PV Rooftop Technician', monthly_wage_inr: 28000, status: 'benchmark' },
        current_benchmark: {
          benchmark_id: 'bmk-gig-01',
          occupation_name: 'Delivery / Courier Rider',
          employment_type: 'Gig Worker',
          wage_type: 'earning',
          monthly_median_inr: 18000,
          currency: 'INR',
          geography_level: 'District',
          source_id: 'src-mock-01',
          source_title: 'Karnataka Gig Worker Survey 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        target_benchmark: {
          benchmark_id: 'bmk-solar-01',
          occupation_name: 'Solar PV Rooftop Technician',
          employment_type: 'Clean Tech Installer',
          wage_type: 'salary',
          monthly_median_inr: 28000,
          currency: 'INR',
          geography_level: 'District',
          source_id: 'src-mock-01',
          source_title: 'Karnataka Clean Tech Wage Survey 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        absolute_lift_inr: 10000,
        percentage_lift: 55.6,
        absolute_difference_inr: 10000,
        percentage_difference: 55.6,
        available: true,
        data_status: 'mock',
        source_label: 'Karnataka Renewable Energy Sector Benchmark (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 75,
        label: 'Good',
        overlap_component: 18,
        gap_component: 18,
        transition_component: 19,
        training_component: 10,
        centre_component: 10,
        explanation: 'Accelerating installations under PM Surya Ghar Muft Bijli Yojana in Karnataka urban areas.'
      },
      rationale: 'Rapid expansion of PM Surya Ghar rooftop solar creates strong demand for field technicians with reliable mobility.',
      market_demand_note: 'Accelerating installations across Karnataka under PM Surya Ghar Muft Bijli Yojana.',
      next_action: 'Register for the Suryamitra Solar PV Technician program at KREDL-empanelled centres in Bengaluru.'
    }
  ]
};

export const domesticWorkerSkillBridge: SkillBridgeResult = {
  current_occupation: {
    id: 'occ-002',
    name_en: 'Domestic Worker / Household Assistant',
    name_kn: 'ಮನೆಗೆಲಸದ ಸಹಾಯಕರು',
    name_hi: 'घरेलू सहायिका',
    sector: 'Domestic Services',
    nco_code: '9111.0100',
    is_informal_sector: true,
    description: 'Informal household cleaning, meal preparation, and family support.'
  },
  current_skills: [
    {
      id: 'skl-010',
      name_en: 'Time Management & Domestic Organization',
      name_kn: 'ಸಮಯ ನಿರ್ವಹಣೆ ಮತ್ತು ಮನೆ ಕೆಲಸ',
      category: 'Operational',
      skill_level: 'Level 1'
    },
    {
      id: 'skl-011',
      name_en: 'Fabric Care & Garment Handling',
      name_kn: 'ಬಟ್ಟೆಗಳ ನಿರ್ವಹಣೆ ಮತ್ತು ಸ್ವಚ್ಛತೆ',
      category: 'Service',
      skill_level: 'Level 1'
    }
  ],
  warnings: [],
  pathways: [
    {
      transition_id: 'trans-002-primary',
      pathway_type: 'direct',
      confidence: 'expert-curated',
      confidence_note: 'Natural skill progression from garment care into motorized tailoring; supported by PM Vishwakarma toolkit voucher.',
      current_occupation: {
        id: 'occ-002',
        name_en: 'Domestic Worker / Household Assistant',
        name_kn: 'ಮನೆಗೆಲಸದ ಸಹಾಯಕರು',
        name_hi: 'घरेलू सहायिका',
        sector: 'Domestic Services',
        nco_code: '9111.0100',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-020',
        name_en: 'Self Employed Tailor',
        name_kn: 'ಸ್ವಯಂ ಉದ್ಯೋಗಿ ದರ್ಜಿ',
        name_hi: 'स्व-नियोजित दर्जी',
        sector: 'Apparel & Garment Manufacturing',
        nco_code: '7531.0100',
        is_informal_sector: true,
        description: 'Independent tailoring, stitching, alterations, and garment entrepreneurship.'
      },
      target_skill: {
        id: 'skl-012',
        name_en: 'Self Employed Tailor',
        name_kn: 'ಸ್ವಯಂ ಉದ್ಯೋಗಿ ದರ್ಜಿ',
        name_hi: 'स्व-नियोजित दर्जी',
        category: 'Apparel & Garment',
        skill_level: 'Level 3',
        is_certifiable: true,
        certifying_body: 'Apparel Made-Ups & Home Furnishing SSC (AMHSSC)'
      },
      current_skills: [
        {
          id: 'skl-010',
          name_en: 'Time Management & Domestic Organization',
          category: 'Operational',
          skill_level: 'Level 1'
        },
        {
          id: 'skl-011',
          name_en: 'Fabric Care & Garment Handling',
          category: 'Service',
          skill_level: 'Level 1'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-011'],
        overlap_skills: [
          {
            id: 'skl-011',
            name_en: 'Fabric Care & Garment Handling',
            category: 'Service',
            skill_level: 'Level 1'
          }
        ],
        target_skill_ids: ['skl-012', 'skl-013'],
        target_skills: [
          {
            id: 'skl-012',
            name_en: 'Self Employed Tailor',
            category: 'Apparel & Garment',
            skill_level: 'Level 3'
          },
          {
            id: 'skl-013',
            name_en: 'Pattern Cutting & Sewing Machine Operation',
            category: 'Technical',
            skill_level: 'Level 2'
          }
        ],
        overlap_count: 1,
        total_target_skills: 2,
        overlap_percentage: 50.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-012',
          skill_name: 'Motorized Sewing Machine Operation & Stitching',
          skill_category: 'Tailoring',
          gap_type: 'target',
          rationale: 'Required for commercial garment stitching and customer alterations.',
          has_it: false,
          how_to_close: 'Complete Self Employed Tailor Course at Govt ITI Women Mysuru'
        }
      ],
      bridge_skills: [
        {
          id: 'skl-013',
          name_en: 'Pattern Cutting & Sewing Machine Operation',
          name_kn: 'ಮಾದರಿ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಯಂತ್ರ ಬಳಕೆ',
          category: 'Technical',
          skill_level: 'Level 2'
        }
      ],
      courses: [
        {
          id: 'crs-003',
          title: 'Self Employed Tailor (AMH/Q1947)',
          skill_id: 'skl-012',
          level: 'NSQF Level 3',
          duration_value: 340,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'Apparel Made-Ups & Home Furnishing Sector Skill Council',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-001',
          provider: 'Government ITI for Women Mysuru'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-020',
          name: 'Government Industrial Training Institute (ITI) for Women Mysuru',
          district: 'Mysuru',
          taluk: 'Mysuru Urban',
          address: 'Nazarbad Main Road, Mysuru, Karnataka 570010',
          latitude: 12.3082,
          longitude: 76.6657,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 821 244 5678',
          distance_km: 2.3,
          distance_type: 'exact'
        }
      ],
      scheme: {
        id: 'sch-003',
        name_en: 'PM Vishwakarma Scheme (Darzi / Tailor Trade)',
        name_kn: 'ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಯೋಜನೆ (ದರ್ಜಿ)',
        name_hi: 'पीएम विश्वकर्मा योजना (दर्जी)',
        issuing_authority: 'Ministry of MSME, Government of India',
        scheme_type: 'Central Artisan & Micro-Enterprise Welfare',
        benefit_summary: 'Free 5-7 days skill verification training with ₹500/day stipend, ₹15,000 digital toolkit voucher, and collateral-free enterprise loan up to ₹1 Lakh at 5% interest.',
        official_url: 'https://pmvishwakarma.gov.in',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-003',
        scheme_name: 'PM Vishwakarma Scheme (Darzi / Tailor)',
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-vis-01',
            description: 'Traditional artisanal or hands-on trade engagement (Age 32, Female profile match)',
            passed: true,
            result: 'pass',
            detail: 'Artisan trade match'
          },
          {
            rule_id: 'rule-vis-02',
            description: 'Age above 18 years satisfied',
            passed: true,
            result: 'pass',
            detail: 'Age 32'
          },
          {
            rule_id: 'rule-vis-03',
            description: 'No prior PMEGP/Mudra formal default registered',
            passed: true,
            result: 'pass'
          }
        ],
        disclaimer: 'Grama One / Karnataka One biometrics required for onboarding.'
      },
      certification_status: 'Government Recognized — PM Vishwakarma / NCVT',
      wage_lift: {
        current: { occupation: 'Domestic Worker', monthly_wage_inr: 8000, status: 'benchmark' },
        target: { occupation: 'Self Employed Tailor', monthly_wage_inr: 16000, status: 'benchmark' },
        current_benchmark: {
          benchmark_id: 'bmk-dom-01',
          occupation_name: 'Domestic Worker',
          employment_type: 'Informal Household Worker',
          wage_type: 'earning',
          monthly_median_inr: 8000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Mysuru',
          source_id: 'src-mock-02',
          source_title: 'Karnataka Unorganised Labour Survey 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        target_benchmark: {
          benchmark_id: 'bmk-tailor-01',
          occupation_name: 'Self Employed Tailor',
          employment_type: 'Self Employed',
          wage_type: 'earning',
          monthly_median_inr: 16000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Mysuru',
          source_id: 'src-mock-02',
          source_title: 'Karnataka Apparel Sector Benchmark 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        absolute_lift_inr: 8000,
        percentage_lift: 100.0,
        absolute_difference_inr: 8000,
        percentage_difference: 100.0,
        available: true,
        data_status: 'mock',
        source_label: 'Karnataka Garment Sector Benchmark (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 85,
        label: 'Strong',
        overlap_component: 22,
        gap_component: 20,
        transition_component: 23,
        training_component: 10,
        centre_component: 10,
        explanation: 'Direct transfer of fabric handling into commercial tailoring; ₹15,000 PM Vishwakarma toolkit eliminates upfront capital barriers.'
      },
      rationale: 'Familiarity with fabrics, laundering, and household garments provides practical foundation for professional tailoring and home-based garment alterations.',
      market_demand_note: 'High demand for custom alterations and festive garments in residential Mysuru neighborhoods.',
      next_action: 'Visit nearest Grama One or Karnataka One centre in Mysuru to register for PM Vishwakarma under the Tailor trade and claim your ₹15,000 toolkit voucher.'
    },
    {
      transition_id: 'trans-002-alt',
      pathway_type: 'bridge',
      confidence: 'expert-curated',
      confidence_note: 'Care-economy transition with high institutional hiring demand in hospitals and elder care homes.',
      current_occupation: {
        id: 'occ-002',
        name_en: 'Domestic Worker',
        sector: 'Domestic Services',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-021',
        name_en: 'General Duty Healthcare Assistant',
        name_kn: 'ಸಾಮಾನ್ಯ ಕರ್ತವ್ಯ ಆರೋಗ್ಯ ಸಹಾಯಕರು',
        sector: 'Healthcare & Life Sciences',
        nco_code: '5321.0100'
      },
      target_skill: {
        id: 'skl-015',
        name_en: 'Patient Hygiene & Vital Signs Monitoring',
        category: 'Healthcare',
        skill_level: 'Level 3'
      },
      current_skills: [
        {
          id: 'skl-010',
          name_en: 'Time Management & Domestic Organization',
          category: 'Operational',
          skill_level: 'Level 1'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-010'],
        overlap_skills: [
          {
            id: 'skl-010',
            name_en: 'Time Management & Domestic Organization',
            category: 'Operational',
            skill_level: 'Level 1'
          }
        ],
        target_skill_ids: ['skl-015'],
        target_skills: [
          {
            id: 'skl-015',
            name_en: 'Patient Hygiene & Vital Signs Monitoring',
            category: 'Healthcare',
            skill_level: 'Level 3'
          }
        ],
        overlap_count: 1,
        total_target_skills: 1,
        overlap_percentage: 100.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-015',
          skill_name: 'Patient Vital Signs Recording & Infection Control',
          skill_category: 'Healthcare',
          gap_type: 'target',
          rationale: 'Clinical protocols for patient care and sanitization.',
          has_it: false,
          how_to_close: 'Complete General Duty Assistant Course (HSS/Q5101)'
        }
      ],
      bridge_skills: [],
      courses: [
        {
          id: 'crs-004',
          title: 'General Duty Assistant (NSQF Level 3)',
          skill_id: 'skl-015',
          level: 'NSQF Level 3',
          duration_value: 360,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'Healthcare Sector Skill Council',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-001',
          provider: 'Mysuru District Hospital Skill Centre'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-020',
          name: 'Government ITI for Women Mysuru',
          district: 'Mysuru',
          distance_km: 2.3
        }
      ],
      scheme: {
        id: 'sch-001',
        name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
        issuing_authority: 'Karnataka Skill Development Corporation',
        scheme_type: 'Healthcare Skilling Grant',
        benefit_summary: 'Free healthcare training and government hospital internship stipend.',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-001',
        scheme_name: 'CMKKY Healthcare Grant',
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-01',
            description: 'Resident of Karnataka',
            passed: true,
            result: 'pass'
          }
        ]
      },
      certification_status: 'Government Recognized — HSSC NSQF Level 3',
      wage_lift: {
        current: { occupation: 'Domestic Worker', monthly_wage_inr: 8000, status: 'benchmark' },
        target: { occupation: 'General Duty Healthcare Assistant', monthly_wage_inr: 18000, status: 'benchmark' },
        absolute_lift_inr: 10000,
        percentage_lift: 125.0,
        absolute_difference_inr: 10000,
        percentage_difference: 125.0,
        available: true,
        data_status: 'mock',
        source_label: 'Karnataka Healthcare Sector Survey 2024 (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 73,
        label: 'Good',
        overlap_component: 16,
        gap_component: 18,
        transition_component: 19,
        training_component: 10,
        centre_component: 10,
        explanation: 'Steady formal healthcare payroll with Provident Fund and hospital shift allowances.'
      },
      rationale: 'Domestic care experience translates into clinical assistant roles with predictable shifts and healthcare benefits.',
      market_demand_note: 'Expanding private nursing homes and assisted elder care in Mysuru.',
      next_action: 'Explore the 360-hour Healthcare General Duty Assistant module at Mysuru District Hospital Skill Centre.'
    }
  ]
};

export const constructionSkillBridge: SkillBridgeResult = {
  current_occupation: {
    id: 'occ-003',
    name_en: 'Construction Labourer / Helper',
    name_kn: 'ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ',
    name_hi: 'निर्माण श्रमिक',
    sector: 'Construction & Real Estate',
    nco_code: '9312.0100',
    is_informal_sector: true,
    description: 'Manual material handling, site excavation, and masonry assistance.'
  },
  current_skills: [
    {
      id: 'skl-020',
      name_en: 'Heavy Material Handling & Physical Stamina',
      name_kn: 'ಭಾರವಾದ ವಸ್ತುಗಳ ನಿರ್ವಹಣೆ',
      category: 'Physical',
      skill_level: 'Level 1'
    },
    {
      id: 'skl-021',
      name_en: 'Basic Site Safety & Tool Usage',
      name_kn: 'ಮೂಲ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣ ಬಳಕೆ',
      category: 'Operational',
      skill_level: 'Level 1'
    }
  ],
  warnings: [],
  pathways: [
    {
      transition_id: 'trans-003-primary',
      pathway_type: 'bridge',
      confidence: 'data-driven',
      confidence_note: 'High regional demand in Belagavi manufacturing cluster; physical strength and tool handling enable rapid qualification in mechanical fitting.',
      current_occupation: {
        id: 'occ-003',
        name_en: 'Construction Labourer / Helper',
        name_kn: 'ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕ',
        name_hi: 'निर्माण श्रमिक',
        sector: 'Construction & Real Estate',
        nco_code: '9312.0100',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-030',
        name_en: 'Mechanical Fitter / Assembly Technician',
        name_kn: 'ಮೆಕ್ಯಾನಿಕಲ್ ಫಿಟ್ಟರ್',
        name_hi: 'मैकेनिकल फिटर',
        sector: 'Manufacturing & Engineering',
        nco_code: '7214.0100',
        is_informal_sector: false,
        description: 'Industrial machinery assembly, bench fitting, and component alignment.'
      },
      target_skill: {
        id: 'skl-022',
        name_en: 'Mechanical Fitter / Assembly Technician',
        name_kn: 'ಮೆಕ್ಯಾನಿಕಲ್ ಫಿಟ್ಟರ್',
        name_hi: 'मैकेनिकल फिटर',
        category: 'Manufacturing & Engineering',
        skill_level: 'Level 3',
        is_certifiable: true,
        certifying_body: 'DGT / NCVT'
      },
      current_skills: [
        {
          id: 'skl-020',
          name_en: 'Heavy Material Handling & Physical Stamina',
          category: 'Physical',
          skill_level: 'Level 1'
        },
        {
          id: 'skl-021',
          name_en: 'Basic Site Safety & Tool Usage',
          category: 'Operational',
          skill_level: 'Level 1'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-021'],
        overlap_skills: [
          {
            id: 'skl-021',
            name_en: 'Basic Site Safety & Tool Usage',
            category: 'Operational',
            skill_level: 'Level 1'
          }
        ],
        target_skill_ids: ['skl-022', 'skl-023'],
        target_skills: [
          {
            id: 'skl-022',
            name_en: 'Mechanical Fitter / Assembly Technician',
            category: 'Manufacturing & Engineering',
            skill_level: 'Level 3'
          },
          {
            id: 'skl-023',
            name_en: 'Precision Measurement & Bench Work',
            category: 'Technical',
            skill_level: 'Level 2'
          }
        ],
        overlap_count: 1,
        total_target_skills: 2,
        overlap_percentage: 50.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-022',
          skill_name: 'Precision Metal Filing & Component Assembly',
          skill_category: 'Manufacturing',
          gap_type: 'target',
          rationale: 'Technical requirement to interpret component drawings and use vernier calipers.',
          has_it: false,
          how_to_close: 'Complete Industrial Mechanical Fitter Course (crs-005)'
        }
      ],
      bridge_skills: [
        {
          id: 'skl-023',
          name_en: 'Precision Measurement & Bench Work',
          name_kn: 'ನಿಖರ ಅಳತೆ ಮತ್ತು ಬೆಂಚ್ ಕೆಲಸ',
          category: 'Technical',
          skill_level: 'Level 2'
        }
      ],
      courses: [
        {
          id: 'crs-005',
          title: 'Industrial Mechanical Fitter (NSQF Level 3)',
          skill_id: 'skl-022',
          level: 'NSQF Level 3',
          duration_value: 300,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'Directorate General of Training (DGT)',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-018',
          provider: 'Government ITI Belagavi'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-040',
          name: 'Government Industrial Training Institute (ITI) Belagavi',
          district: 'Belagavi',
          taluk: 'Belagavi',
          address: 'Majagaon Road, Udyambag, Belagavi, Karnataka 590008',
          latitude: 15.8234,
          longitude: 74.5021,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 831 244 1230',
          distance_km: 3.6,
          distance_type: 'exact'
        }
      ],
      scheme: {
        id: 'sch-008',
        name_en: 'Karnataka Building & Other Construction Workers Board (KBOCWWB)',
        name_kn: 'ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಮತ್ತು ಇತರೆ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿ',
        name_hi: 'कर्नाटक भवन एवं अन्य सन्निर्माण कर्मकार कल्याण बोर्ड',
        issuing_authority: 'Labour Department, Government of Karnataka',
        scheme_type: 'Welfare & Skill Upgrade Subsidy',
        benefit_summary: 'Toolkits, skill upgradation stipends, accident cover, and scholarship assistance for registered construction workers.',
        official_url: 'https://karbwwb.karnataka.gov.in',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-008',
        scheme_name: 'KBOCWWB Skill Upgrade Scheme',
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-kbocw-01',
            description: 'Engaged in manual/construction building labor in Karnataka',
            passed: true,
            result: 'pass',
            detail: 'Construction Labourer match'
          },
          {
            rule_id: 'rule-kbocw-02',
            description: 'Age between 18 and 60 years satisfied (Age 28)',
            passed: true,
            result: 'pass',
            detail: 'Age 28'
          }
        ]
      },
      certification_status: 'Government Recognized — DGT / NCVT Level 3',
      wage_lift: {
        current: { occupation: 'Construction Labourer', monthly_wage_inr: 12000, status: 'benchmark' },
        target: { occupation: 'Mechanical Fitter', monthly_wage_inr: 29000, status: 'benchmark' },
        current_benchmark: {
          benchmark_id: 'bmk-const-01',
          occupation_name: 'Construction Labourer',
          employment_type: 'Daily Wage Manual Worker',
          wage_type: 'earning',
          monthly_median_inr: 12000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Belagavi',
          source_id: 'src-mock-03',
          source_title: 'Karnataka Daily Wage Labour Survey 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        target_benchmark: {
          benchmark_id: 'bmk-fitter-01',
          occupation_name: 'Mechanical Fitter',
          employment_type: 'Industrial Technician',
          wage_type: 'salary',
          monthly_median_inr: 29000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Belagavi',
          source_id: 'src-mock-03',
          source_title: 'Belagavi Industrial Hub Benchmark 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        absolute_lift_inr: 17000,
        percentage_lift: 141.7,
        absolute_difference_inr: 17000,
        percentage_difference: 141.7,
        available: true,
        data_status: 'mock',
        source_label: 'Belagavi Industrial Hub Benchmark (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 78,
        label: 'Good',
        overlap_component: 18,
        gap_component: 18,
        transition_component: 22,
        training_component: 10,
        centre_component: 10,
        explanation: 'Major engineering foundry cluster in Belagavi provides consistent demand and rapid industrial placement.'
      },
      rationale: 'Industrial machine manufacturing in Belagavi demands mechanical fitters; your heavy tool handling and stamina translate into industrial machinery assembly.',
      market_demand_note: 'Over 200 automotive and hydraulic pump foundries in Belagavi actively hire certified fitters.',
      next_action: 'Register at Government ITI Belagavi for the Industrial Mechanical Fitter batch under KBOCWWB skill upgradation scheme.'
    },
    {
      transition_id: 'trans-003-alt',
      pathway_type: 'bridge',
      confidence: 'data-driven',
      confidence_note: 'Foundational metal fabrication pathway with immediate industrial yard placement.',
      current_occupation: {
        id: 'occ-003',
        name_en: 'Construction Labourer',
        sector: 'Construction',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-031',
        name_en: 'Shielded Metal Arc Welder (SMAW)',
        name_kn: 'ವೆಲ್ಡರ್',
        sector: 'Fabrication & Welding',
        nco_code: '7212.0100'
      },
      target_skill: {
        id: 'skl-025',
        name_en: 'Arc & Gas Welding Technique',
        category: 'Fabrication',
        skill_level: 'Level 2'
      },
      current_skills: [
        {
          id: 'skl-021',
          name_en: 'Basic Site Safety & Tool Usage',
          category: 'Operational',
          skill_level: 'Level 1'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-021'],
        overlap_skills: [
          {
            id: 'skl-021',
            name_en: 'Basic Site Safety & Tool Usage',
            category: 'Operational',
            skill_level: 'Level 1'
          }
        ],
        target_skill_ids: ['skl-025'],
        target_skills: [
          {
            id: 'skl-025',
            name_en: 'Arc & Gas Welding Technique',
            category: 'Fabrication',
            skill_level: 'Level 2'
          }
        ],
        overlap_count: 1,
        total_target_skills: 1,
        overlap_percentage: 100.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-025',
          skill_name: 'Shielded Arc Welding Position 1G/2G',
          skill_category: 'Fabrication',
          gap_type: 'target',
          rationale: 'Standard structural welding safety and bead consistency.',
          has_it: false,
          how_to_close: 'SMAW 200-hour module'
        }
      ],
      bridge_skills: [],
      courses: [
        {
          id: 'crs-006',
          title: 'Shielded Metal Arc Welder (NSQF Level 2)',
          skill_id: 'skl-025',
          level: 'NSQF Level 2',
          duration_value: 240,
          duration_unit: 'hours',
          mode: 'offline',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-018',
          provider: 'Bailhongal Rural Skill Centre'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-040',
          name: 'Government ITI Belagavi',
          district: 'Belagavi',
          distance_km: 3.6
        }
      ],
      scheme: {
        id: 'sch-008',
        name_en: 'KBOCWWB Welding Grant',
        issuing_authority: 'Karnataka Labour Department',
        scheme_type: 'Vocational Grant',
        benefit_summary: 'Free safety gear kit and monthly stipend during training.',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-008',
        scheme_name: 'KBOCWWB Welding Grant',
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-01',
            description: 'Karnataka Building Worker registration eligibility',
            passed: true,
            result: 'pass'
          }
        ]
      },
      certification_status: 'Government Recognized — NCVT Level 2',
      wage_lift: {
        current: { occupation: 'Construction Labourer', monthly_wage_inr: 12000, status: 'benchmark' },
        target: { occupation: 'Shielded Metal Arc Welder', monthly_wage_inr: 25000, status: 'benchmark' },
        absolute_lift_inr: 13000,
        percentage_lift: 108.3,
        absolute_difference_inr: 13000,
        percentage_difference: 108.3,
        available: true,
        data_status: 'mock',
        source_label: 'Karnataka Fabrication Sector Benchmark (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 74,
        label: 'Good',
        overlap_component: 17,
        gap_component: 17,
        transition_component: 20,
        training_component: 10,
        centre_component: 10,
        explanation: 'Structural fabrication shops in Belagavi offer rapid job placement.'
      },
      rationale: 'Site fabrication experience prepares workers quickly for certified structural arc welding.',
      market_demand_note: 'High demand across heavy civil infrastructure and bridge construction.',
      next_action: 'Enroll in the Shielded Metal Arc Welding course at Bailhongal Rural Skill Training Centre.'
    }
  ]
};

export const autoRickshawSkillBridge: SkillBridgeResult = {
  current_occupation: {
    id: 'occ-004',
    name_en: 'Auto-Rickshaw / Commercial Driver',
    name_kn: 'ಆಟೋ ರಿಕ್ಷಾ ಚಾಲಕರು',
    name_hi: 'ऑटो-रिक्शा चालक',
    sector: 'Automotive & Passenger Transport',
    nco_code: '8321.0100',
    is_informal_sector: true,
    description: 'Commercial three-wheeler transport and fleet operation.'
  },
  current_skills: [
    {
      id: 'skl-030',
      name_en: 'Commercial Driving & Road Safety Regulation',
      name_kn: 'ವಾಣಿಜ್ಯ ಚಾಲನೆ ಮತ್ತು ರಸ್ತೆ ಸುರಕ್ಷತೆ',
      category: 'Operational',
      skill_level: 'Level 2'
    },
    {
      id: 'skl-031',
      name_en: 'Basic IC Engine & Brake Maintenance',
      name_kn: 'ವಾಹನ ನಿರ್ವಹಣೆ ಮತ್ತು ರಿಪೇರಿ',
      category: 'Mechanical',
      skill_level: 'Level 2'
    }
  ],
  warnings: [],
  pathways: [
    {
      transition_id: 'trans-004-primary',
      pathway_type: 'bridge',
      confidence: 'data-driven',
      confidence_note: 'Frontline electric transition in Hubballi-Dharwad; mechanical automotive familiarity allows fast upskilling to EV battery diagnostic benchwork.',
      current_occupation: {
        id: 'occ-004',
        name_en: 'Auto-Rickshaw / Commercial Driver',
        name_kn: 'ಆಟೋ ರಿಕ್ಷಾ ಚಾಲಕರು',
        name_hi: 'ऑटो-रिक्शा चालक',
        sector: 'Automotive & Passenger Transport',
        nco_code: '8321.0100',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-040',
        name_en: 'Electric Vehicle (EV) Service Technician',
        name_kn: 'ಇವಿ ಸೇವಾ ತಂತ್ರಜ್ಞ',
        name_hi: 'इलेक्ट्रिक वाहन (EV) तकनीशियन',
        sector: 'Clean Energy & Automotive Tech',
        nco_code: '7231.0200',
        is_informal_sector: false,
        description: 'Certified diagnostic specialist for lithium battery packs, motor controllers, and EV chargers.'
      },
      target_skill: {
        id: 'skl-032',
        name_en: 'Electric Vehicle (EV) Service Technician',
        name_kn: 'ಇವಿ ಸೇವಾ ತಂತ್ರಜ್ಞ',
        name_hi: 'इलेक्ट्रिक वाहन (EV) तकनीशियन',
        category: 'Clean Energy & Automotive',
        skill_level: 'Level 4',
        is_certifiable: true,
        certifying_body: 'Automotive Skills Development Council (ASDC)'
      },
      current_skills: [
        {
          id: 'skl-030',
          name_en: 'Commercial Driving & Road Safety Regulation',
          category: 'Operational',
          skill_level: 'Level 2'
        },
        {
          id: 'skl-031',
          name_en: 'Basic IC Engine & Brake Maintenance',
          category: 'Mechanical',
          skill_level: 'Level 2'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-031'],
        overlap_skills: [
          {
            id: 'skl-031',
            name_en: 'Basic IC Engine & Brake Maintenance',
            category: 'Mechanical',
            skill_level: 'Level 2'
          }
        ],
        target_skill_ids: ['skl-032', 'skl-033'],
        target_skills: [
          {
            id: 'skl-032',
            name_en: 'Electric Vehicle (EV) Service Technician',
            category: 'Clean Energy & Automotive',
            skill_level: 'Level 4'
          },
          {
            id: 'skl-033',
            name_en: 'High Voltage EV Battery Safety & Diagnostics',
            category: 'Specialized Technical',
            skill_level: 'Level 3'
          }
        ],
        overlap_count: 1,
        total_target_skills: 2,
        overlap_percentage: 50.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-032',
          skill_name: 'EV Powertrain & BMS Diagnostics',
          skill_category: 'Automotive',
          gap_type: 'target',
          rationale: 'Essential for diagnostic scanner usage, regenerative braking inspection, and lithium battery maintenance.',
          has_it: false,
          how_to_close: 'Complete ASDC Level 4 EV Technician Course (crs-008)'
        }
      ],
      bridge_skills: [
        {
          id: 'skl-033',
          name_en: 'High Voltage EV Battery Safety & Diagnostics',
          name_kn: 'ಇವಿ ಬ್ಯಾಟರಿ ಸುರಕ್ಷತೆ ಮತ್ತು ತಪಾಸಣೆ',
          category: 'Specialized Technical',
          skill_level: 'Level 3'
        }
      ],
      courses: [
        {
          id: 'crs-008',
          title: 'Electric Vehicle Service Lead Technician (ASC/Q1424)',
          skill_id: 'skl-032',
          level: 'NSQF Level 4',
          duration_value: 360,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'Automotive Skills Development Council (ASDC)',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-019',
          provider: 'Karnataka German Technical Training Institute (KGTTI) Hubballi'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-055',
          name: 'KGTTI Hubballi Technical Campus',
          district: 'Dharwad',
          taluk: 'Hubballi',
          address: 'Gokul Road, Industrial Estate, Hubballi, Karnataka 580030',
          latitude: 15.3524,
          longitude: 75.1218,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 836 233 4400',
          distance_km: 4.8,
          distance_type: 'exact'
        }
      ],
      scheme: {
        id: 'sch-001',
        name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
        name_kn: 'ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ',
        issuing_authority: 'Karnataka Skill Development Corporation',
        benefit_summary: 'Free certified EV technology curriculum and placement linkages across authorized dealership service networks.',
        official_url: 'https://kaushalkar.karnataka.gov.in',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-001',
        scheme_name: 'CMKKY Emerging Tech Grant',
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-ev-01',
            description: '12th Pass qualification satisfied for NSQF Level 4 curriculum',
            passed: true,
            result: 'pass',
            detail: '12th Pass'
          },
          {
            rule_id: 'rule-ev-02',
            description: 'Karnataka domicile (Dharwad district resident match)',
            passed: true,
            result: 'pass',
            detail: 'Dharwad'
          }
        ]
      },
      certification_status: 'Government Recognized — ASDC NSQF Level 4',
      wage_lift: {
        current: { occupation: 'Auto-Rickshaw Driver', monthly_wage_inr: 18000, status: 'benchmark' },
        target: { occupation: 'EV Technician', monthly_wage_inr: 32000, status: 'benchmark' },
        current_benchmark: {
          benchmark_id: 'bmk-auto-01',
          occupation_name: 'Auto-Rickshaw Driver',
          employment_type: 'Commercial Driver',
          wage_type: 'earning',
          monthly_median_inr: 18000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Dharwad',
          source_id: 'src-mock-04',
          source_title: 'North Karnataka Transport Survey 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        target_benchmark: {
          benchmark_id: 'bmk-ev-01',
          occupation_name: 'EV Technician',
          employment_type: 'Automotive Specialist',
          wage_type: 'salary',
          monthly_median_inr: 32000,
          currency: 'INR',
          geography_level: 'District',
          district: 'Dharwad',
          source_id: 'src-mock-04',
          source_title: 'Hubballi-Dharwad EV Cluster Benchmark 2024 (Mock)',
          confidence: 'Heuristic',
          disclaimer: 'Illustrative mock data for hackathon demonstration.',
          data_status: 'mock'
        },
        absolute_lift_inr: 14000,
        percentage_lift: 77.8,
        absolute_difference_inr: 14000,
        percentage_difference: 77.8,
        available: true,
        data_status: 'mock',
        source_label: 'Hubballi-Dharwad EV Cluster Benchmark (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 88,
        label: 'Strong',
        overlap_component: 22,
        gap_component: 22,
        transition_component: 24,
        training_component: 10,
        centre_component: 10,
        explanation: 'Rapid electrification of commercial 3-wheelers in Hubballi-Dharwad creates urgent demand for certified dealership technicians.'
      },
      rationale: 'Rapid conversion of urban fleets to electric autos in Karnataka creates massive local service demand; your mechanical familiarity enables swift upskilling into battery diagnosis.',
      market_demand_note: 'Fastest-growing transport category in North Karnataka with EV auto conversions.',
      next_action: 'Visit KGTTI Hubballi campus on Gokul Road to enroll in the free ASDC EV Technician course under CMKKY.'
    },
    {
      transition_id: 'trans-004-alt',
      pathway_type: 'bridge',
      confidence: 'expert-curated',
      confidence_note: 'Logistics fleet operations pathway using regional route navigation mastery.',
      current_occupation: {
        id: 'occ-004',
        name_en: 'Auto-Rickshaw Driver',
        sector: 'Transport',
        is_informal_sector: true
      },
      target_occupation: {
        id: 'occ-041',
        name_en: 'Commercial Fleet Dispatcher & Fleet Coordinator',
        name_kn: 'ಫ್ಲೀಟ್ ಸಂಯೋಜಕರು',
        sector: 'Logistics & Supply Chain',
        nco_code: '4323.0100'
      },
      target_skill: {
        id: 'skl-035',
        name_en: 'GPS Fleet Telematics & Vehicle Allocation',
        category: 'Logistics',
        skill_level: 'Level 3'
      },
      current_skills: [
        {
          id: 'skl-030',
          name_en: 'Commercial Driving & Road Safety Regulation',
          category: 'Operational',
          skill_level: 'Level 2'
        }
      ],
      skill_overlap: {
        overlap_skill_ids: ['skl-030'],
        overlap_skills: [
          {
            id: 'skl-030',
            name_en: 'Commercial Driving & Road Safety Regulation',
            category: 'Operational',
            skill_level: 'Level 2'
          }
        ],
        target_skill_ids: ['skl-035'],
        target_skills: [
          {
            id: 'skl-035',
            name_en: 'GPS Fleet Telematics & Vehicle Allocation',
            category: 'Logistics',
            skill_level: 'Level 3'
          }
        ],
        overlap_count: 1,
        total_target_skills: 1,
        overlap_percentage: 100.0
      },
      skill_gaps: [
        {
          skill_id: 'skl-035',
          skill_name: 'Fleet Telematics Software & Route Optimization',
          skill_category: 'Logistics',
          gap_type: 'target',
          rationale: 'Supervising driver fleets via central dispatch dashboards.',
          has_it: false,
          how_to_close: 'Complete Fleet Coordinator Certification'
        }
      ],
      bridge_skills: [],
      courses: [
        {
          id: 'crs-009',
          title: 'Commercial Fleet Coordinator (NSQF Level 4)',
          skill_id: 'skl-035',
          level: 'NSQF Level 4',
          duration_value: 280,
          duration_unit: 'hours',
          mode: 'offline',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-019',
          provider: 'KGTTI Hubballi'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-055',
          name: 'KGTTI Hubballi Technical Campus',
          district: 'Dharwad',
          distance_km: 4.8
        }
      ],
      scheme: {
        id: 'sch-001',
        name_en: 'CMKKY Logistics Grant',
        issuing_authority: 'KSDC',
        scheme_type: 'Supply Chain Grant',
        benefit_summary: 'Fully sponsored telematics certification.',
        status: 'active'
      },
      eligibility: {
        scheme_id: 'sch-001',
        scheme_name: 'CMKKY Logistics Grant',
        verdict: 'eligible',
        reasons: [
          {
            rule_id: 'rule-01',
            description: '12th Pass minimum education match',
            passed: true,
            result: 'pass'
          }
        ]
      },
      certification_status: 'Government Recognized — LSC NSQF Level 4',
      wage_lift: {
        current: { occupation: 'Auto-Rickshaw Driver', monthly_wage_inr: 18000, status: 'benchmark' },
        target: { occupation: 'Fleet Coordinator', monthly_wage_inr: 27000, status: 'benchmark' },
        absolute_lift_inr: 9000,
        percentage_lift: 50.0,
        absolute_difference_inr: 9000,
        percentage_difference: 50.0,
        available: true,
        data_status: 'mock',
        source_label: 'North Karnataka Logistics Survey 2024 (Mock)',
        status: 'available',
        disclaimer: 'Mock/illustrative data for hackathon demonstration. Not an official guarantee of income.'
      },
      pathway_score: {
        total_score: 76,
        label: 'Good',
        overlap_component: 19,
        gap_component: 18,
        transition_component: 19,
        training_component: 10,
        centre_component: 10,
        explanation: 'Growing hub logistics in Dharwad requires experienced drivers transitioning into dispatch.'
      },
      rationale: 'Deep knowledge of regional traffic bottlenecks makes seasoned commercial drivers excellent fleet dispatchers.',
      market_demand_note: 'Logistics distribution parks along NH48 require local coordinators.',
      next_action: 'Apply for the Logistics Sector Skill Council fleet operations program at Hubballi.'
    }
  ]
};
