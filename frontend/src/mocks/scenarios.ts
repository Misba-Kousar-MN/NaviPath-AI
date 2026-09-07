import { RecommendationResponse, WorkerProfileIn } from '../types/recommendation';

export interface DemoScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  initialProfile: WorkerProfileIn;
  response: RecommendationResponse;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'delivery-to-electrician',
    name: 'Delivery Rider → Electrician',
    badge: 'Logistics to Electrical',
    description: 'Transition from gig food/parcel delivery to certified domestic electrical installation in Bengaluru Urban.',
    initialProfile: {
      occupation: 'Delivery / Courier Rider',
      district: 'Bengaluru Urban',
      education: '10th Pass',
      career_goal_text: 'I want to become a certified electrician and do domestic installations',
      language: 'kn',
      age: 26,
      gender: 'Male',
      pincode: '560022',
      latitude: null,
      longitude: null,
      session_id: 'demo-sess-001',
    },
    response: {
      profile: {
        occupation: 'Delivery / Courier Rider',
        district: 'Bengaluru Urban',
        education: '10th Pass',
        career_goal_text: 'I want to become a certified electrician and do domestic installations',
        language: 'kn',
        age: 26,
        gender: 'Male',
        pincode: '560022',
        latitude: null,
        longitude: null,
        session_id: 'demo-sess-001',
      },
      matched_occupation: {
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
      recommended_pathways: [
        {
          target_skill: {
            id: 'skl-004',
            name_en: 'Electrician (Domestic / Installation)',
            name_kn: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ (ಮನೆ ಬಳಕೆಯ / ಅಳವಡಿಕೆ)',
            name_hi: 'इलेक्ट्रीशियन (घरेलू / वायरिंग)',
            category: 'Technical Trades',
            skill_level: 'Level 3'
          },
          bridge_skills: [
            {
              id: 'skl-005',
              name_en: 'Basic Electrical Safety & Hand Tools',
              name_kn: 'ಮೂಲ ವಿದ್ಯುತ್ ಸುರಕ್ಷತೆ ಮತ್ತು ಉಪಕರಣಗಳ ಬಳಕೆ',
              category: 'Foundational Technical',
              skill_level: 'Level 2'
            }
          ],
          rationale: 'High urban demand for domestic electrical repairs; your mobile navigation and customer handling transfer well into on-site service visits; foundational safety training enables swift entry.',
          confidence: 'expert-curated',
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
              certifying_body: 'NCVT / NSDC',
              fee_type: 'free',
              fee_amount_inr: 0,
              source_id: 'src-004',
              provider: 'Karnataka Skill Development Corporation (KSDC) / CMKKY'
            }
          ],
          centres: [
            {
              id: 'tc-001',
              name: 'National Skill Training Institute (NSTI) Bengaluru',
              district: 'Bengaluru Urban',
              taluk: 'Bengaluru North',
              address: 'Outer Ring Road, Yeshwanthpur, Bengaluru, Karnataka 560022',
              latitude: 13.0285,
              longitude: 77.5452,
              recognition_status: 'govt-recognized',
              contact_phone: '+91 80 2337 1311',
              distance_km: 4.2,
              distance_type: 'exact'
            }
          ]
        }
      ],
      skill_gaps: [
        {
          skill_id: 'skl-004',
          skill_name: 'Electrician (Domestic / Installation)',
          skill_category: 'Technical Trades',
          gap_type: 'target',
          rationale: 'Core technical competency required for electrical wiring and certification.',
          has_it: false,
          how_to_close: 'Complete NSQF Level 3 Domestic Electrician Course (crs-002)'
        },
        {
          skill_id: 'skl-005',
          skill_name: 'Basic Electrical Safety & Tool Handling',
          skill_category: 'Foundational Technical',
          gap_type: 'bridge',
          rationale: 'Mandatory prerequisite module on shock prevention, earthing, and multimeters.',
          has_it: false,
          how_to_close: 'Covered in Module 1 of accredited electrician curriculum'
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
          certifying_body: 'National Council for Vocational Training (NCVT)',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-004',
          provider: 'Karnataka Skill Development Corporation (KSDC) / CMKKY'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-001',
          name: 'National Skill Training Institute (NSTI) Bengaluru',
          district: 'Bengaluru Urban',
          taluk: 'Bengaluru North',
          address: 'Outer Ring Road, Yeshwanthpur, Bengaluru, Karnataka 560022',
          latitude: 13.0285,
          longitude: 77.5452,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 80 2337 1311',
          distance_km: 4.2,
          distance_type: 'exact'
        },
        {
          id: 'tc-002',
          name: 'Government Industrial Training Institute (ITI) Bengaluru Peenya',
          district: 'Bengaluru Urban',
          taluk: 'Bengaluru North',
          address: 'Peenya 1st Stage, Near SRS Road, Bengaluru, Karnataka 560058',
          latitude: 13.0312,
          longitude: 77.5188,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 80 2839 4520',
          distance_km: 6.8,
          distance_type: 'exact'
        }
      ],
      schemes: [
        {
          id: 'sch-001',
          name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
          name_kn: 'ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ',
          name_hi: 'मुख्यमंत्री कौशल कर्नाटक योजना',
          issuing_authority: 'Karnataka Skill Development Corporation (KSDC)',
          scheme_type: 'Vocational Training & Subsidy',
          benefit_summary: '100% free government skill training, industry-recognized NCVT certificate, and minimum 70% job placement assistance.',
          official_url: 'https://kaushalkar.karnataka.gov.in',
          status: 'active'
        },
        {
          id: 'sch-002',
          name_en: 'e-Shram Portal Social Security & UAN',
          name_kn: 'ಇ-ಶ್ರಮ್ ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಯುಎಎನ್',
          name_hi: 'ई-श्रम सामाजिक सुरक्षा एवं यूएएन',
          issuing_authority: 'Ministry of Labour & Employment, Govt of India',
          scheme_type: 'Social Security Registration',
          benefit_summary: 'Universal unorganised worker UAN card with accident insurance cover under PMSBY and direct social security integration.',
          official_url: 'https://eshram.gov.in',
          status: 'active'
        }
      ],
      eligibility: [
        {
          scheme_id: 'sch-001',
          scheme_name: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
          verdict: 'eligible',
          reasons: [
            {
              rule_id: 'rule-01',
              field_path: 'profile.district',
              human_readable_condition: 'Resident of Karnataka (Bengaluru Urban)',
              result: 'pass'
            },
            {
              rule_id: 'rule-02',
              field_path: 'profile.age',
              human_readable_condition: 'Age between 18 and 35 years (Age 26)',
              result: 'pass'
            },
            {
              rule_id: 'rule-03',
              field_path: 'profile.education',
              human_readable_condition: 'Minimum educational qualification 10th pass',
              result: 'pass'
            }
          ],
          required_documents: [
            {
              document_id: 'doc-001',
              document_name: 'Aadhaar Card (Mobile Linked)',
              name_kn: 'ಆಧಾರ್ ಕಾರ್ಡ್',
              mandatory: true,
              description: 'Required for biometric verification and DBT benefits'
            },
            {
              document_id: 'doc-002',
              document_name: '10th Standard Passing Certificate / Marks Card',
              name_kn: '೧೦ನೇ ತರಗತಿ ಅಂಕಪಟ್ಟಿ',
              mandatory: true,
              description: 'Required for technical admission qualification'
            }
          ]
        },
        {
          scheme_id: 'sch-002',
          scheme_name: 'e-Shram Portal Social Security',
          verdict: 'eligible',
          reasons: [
            {
              rule_id: 'rule-04',
              field_path: 'profile.age',
              human_readable_condition: 'Age between 16 and 59 years',
              result: 'pass'
            }
          ],
          required_documents: [
            {
              document_id: 'doc-001',
              document_name: 'Aadhaar Card',
              mandatory: true
            },
            {
              document_id: 'doc-003',
              document_name: 'Active Bank Account Passbook',
              mandatory: true
            }
          ]
        }
      ],
      documents: [
        {
          document_id: 'doc-001',
          document_name: 'Aadhaar Card (Linked to Mobile Number)',
          mandatory: true,
          description: 'Required for CMKKY biometric registration and e-Shram verification.'
        },
        {
          document_id: 'doc-002',
          document_name: '10th Standard Marks Card',
          mandatory: true,
          description: 'Proof of basic academic eligibility for NSQF technical course.'
        }
      ],
      evidence_count: 3,
      warnings: [],
      explanation: {
        summary: 'Based on your background in delivery and logistics, your strong street navigation and customer handling make domestic electrical service an ideal upward mobility pathway in Bengaluru Urban.',
        skill_gap_explanation: 'Your primary transition gap is certified electrical safety and circuit wiring (NSQF Level 3). You already have foundational navigation and client service skills.',
        pathway_explanation: 'Government-accredited technical training at NSTI Yeshwanthpur provides full hands-on laboratory experience, tools, and placement support under CMKKY.',
        next_steps: [
          'Register on the official e-Shram portal (eshram.gov.in) to obtain your 12-digit UAN card.',
          'Prepare your Aadhaar card and 10th standard marks card for course admission.',
          'Visit NSTI Bengaluru (Outer Ring Road, Yeshwanthpur) or apply on kaushalkar.karnataka.gov.in for the upcoming free CMKKY batch.',
          'Complete the 350-hour practical electrical module to earn certified NCVT credential.'
        ],
        limitations: [
          'Training batches are scheduled subject to verified seat availability at the institute.'
        ]
      },
      validated_evidence: [
        {
          chunk_id: 'chk-034',
          source_id: 'src-008',
          authority: 'Directorate General of Training (DGT), Ministry of Skill Development',
          excerpt: 'CTS Electrician curriculum emphasizes domestic wiring, earthing, multimeters, and safety protocols for formal trade qualification.',
          page_or_section: 'DGT CTS Electrician Guidelines',
          source_url: 'https://dgt.gov.in'
        },
        {
          chunk_id: 'chk-004',
          source_id: 'src-004',
          authority: 'Karnataka Skill Development Corporation (KSDC)',
          excerpt: 'CMKKY provides 100% tuition-free skill training for eligible Karnataka youth with designated industry placement quotas.',
          page_or_section: 'CMKKY Guidelines, Section 3.2',
          source_url: 'https://kaushalkar.karnataka.gov.in'
        }
      ],
      explanation_status: 'available',
      evidence_status: 'retrieved'
    }
  },
  {
    id: 'domestic-worker-to-tailoring',
    name: 'Domestic Worker → Tailoring',
    badge: 'Household to Apparel',
    description: 'Transition from domestic household work to self-employed tailoring and garment manufacturing in Mysuru.',
    initialProfile: {
      occupation: 'Domestic Worker',
      district: 'Mysuru',
      education: 'Below 10th',
      career_goal_text: 'I want to start my own tailoring work from home',
      language: 'kn',
      age: 32,
      gender: 'Female',
      pincode: '570001',
      latitude: null,
      longitude: null,
      session_id: 'demo-sess-002',
    },
    response: {
      profile: {
        occupation: 'Domestic Worker',
        district: 'Mysuru',
        education: 'Below 10th',
        career_goal_text: 'I want to start my own tailoring work from home',
        language: 'kn',
        age: 32,
        gender: 'Female',
        pincode: '570001',
        latitude: null,
        longitude: null,
        session_id: 'demo-sess-002',
      },
      matched_occupation: {
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
      recommended_pathways: [
        {
          target_skill: {
            id: 'skl-012',
            name_en: 'Self Employed Tailor',
            name_kn: 'ಸ್ವಯಂ ಉದ್ಯೋಗಿ ದರ್ಜಿ',
            name_hi: 'स्व-नियोजित दर्जी',
            category: 'Apparel & Garment',
            skill_level: 'Level 3'
          },
          bridge_skills: [
            {
              id: 'skl-013',
              name_en: 'Pattern Cutting & Sewing Machine Operation',
              name_kn: 'ಪ್ಯಾಟರ್ನ್ ಕಟಿಂಗ್ ಮತ್ತು ಹೊಲಿಗೆ ಯಂತ್ರ ಬಳಕೆ',
              category: 'Technical',
              skill_level: 'Level 2'
            }
          ],
          rationale: 'Direct pathway to home-based income generation and flexibility; your fabric handling experience directly prepares you for machine stitching and pattern measurement.',
          confidence: 'expert-curated',
          courses: [
            {
              id: 'crs-001',
              title: 'Self Employed Tailor (AMH/Q1947)',
              skill_id: 'skl-012',
              level: 'NSQF Level 3',
              duration_value: 240,
              duration_unit: 'hours',
              mode: 'offline',
              is_government_recognized: true,
              certifying_body: 'Apparel Made-Ups & Home Furnishing Sector Skill Council',
              fee_type: 'free',
              fee_amount_inr: 0,
              source_id: 'src-011',
              provider: 'Karnataka German Technical Training Institute (KGTTI) / KSDC'
            }
          ],
          centres: [
            {
              id: 'tc-015',
              name: 'Government ITI for Women, Mysuru',
              district: 'Mysuru',
              taluk: 'Mysuru City',
              address: 'Near Suburb Bus Stand, Mysuru, Karnataka 570001',
              latitude: 12.3082,
              longitude: 76.6575,
              recognition_status: 'govt-recognized',
              contact_phone: '+91 821 244 5560',
              distance_km: 2.1,
              distance_type: 'exact'
            }
          ]
        }
      ],
      skill_gaps: [
        {
          skill_id: 'skl-012',
          skill_name: 'Machine Sewing & Garment Stitching',
          skill_category: 'Apparel',
          gap_type: 'target',
          rationale: 'Required for standard garment measurements, blouse cutting, and seam finishing.',
          has_it: false,
          how_to_close: 'Enroll in Self Employed Tailor certification course (crs-001)'
        }
      ],
      courses: [
        {
          id: 'crs-001',
          title: 'Self Employed Tailor (AMH/Q1947)',
          skill_id: 'skl-012',
          level: 'NSQF Level 3',
          duration_value: 240,
          duration_unit: 'hours',
          mode: 'offline',
          is_government_recognized: true,
          certifying_body: 'Apparel Sector Skill Council (AMHSSC)',
          fee_type: 'free',
          fee_amount_inr: 0,
          source_id: 'src-011',
          provider: 'KGTTI & KSDC Mysuru'
        }
      ],
      nearby_centres: [
        {
          id: 'tc-015',
          name: 'Government ITI for Women, Mysuru',
          district: 'Mysuru',
          taluk: 'Mysuru City',
          address: 'Near Suburb Bus Stand, Mysuru, Karnataka 570001',
          latitude: 12.3082,
          longitude: 76.6575,
          recognition_status: 'govt-recognized',
          contact_phone: '+91 821 244 5560',
          distance_km: 2.1,
          distance_type: 'exact'
        }
      ],
      schemes: [
        {
          id: 'sch-005',
          name_en: 'PM Vishwakarma Scheme (Darzi / Tailor Trade)',
          name_kn: 'ಪಿಎಂ ವಿಶ್ವಕರ್ಮ ಯೋಜನೆ (ದರ್ಜಿ ಕಲೆ)',
          name_hi: 'पीएम विश्वकर्मा योजना (दर्जी)',
          issuing_authority: 'Ministry of Micro, Small and Medium Enterprises (MSME)',
          scheme_type: 'Artisan Toolkit & Credit Support',
          benefit_summary: 'PM Vishwakarma Certificate, ID Card, basic skill training with ₹500/day stipend, and ₹15,000 modern toolkit grant.',
          official_url: 'https://pmvishwakarma.gov.in',
          status: 'active'
        }
      ],
      eligibility: [
        {
          scheme_id: 'sch-005',
          scheme_name: 'PM Vishwakarma (Tailor / Darzi)',
          verdict: 'eligible',
          reasons: [
            {
              rule_id: 'rule-vis-01',
              field_path: 'profile.occupation',
              human_readable_condition: 'Traditional artisan or trade worker in designated list (Darzi)',
              result: 'pass'
            },
            {
              rule_id: 'rule-vis-02',
              field_path: 'profile.age',
              human_readable_condition: 'Minimum 18 years of age (Age 32)',
              result: 'pass'
            }
          ],
          required_documents: [
            {
              document_id: 'doc-001',
              document_name: 'Aadhaar Card linked with mobile number',
              mandatory: true
            },
            {
              document_id: 'doc-004',
              document_name: 'Ration Card / Domicile Certificate',
              mandatory: true
            }
          ]
        }
      ],
      documents: [
        {
          document_id: 'doc-001',
          document_name: 'Aadhaar Card',
          mandatory: true
        }
      ],
      evidence_count: 2,
      warnings: [],
      explanation: {
        summary: 'Your domestic fabric handling skills provide a solid foundation for independent tailoring in Mysuru. Training at the Government Women ITI equips you with machine cutting and garment assembly.',
        skill_gap_explanation: 'Focused training is required on motorized sewing machine operation and standardized pattern drafting.',
        pathway_explanation: 'Self-employed tailoring allows flexible home-based entrepreneurship or micro-boutique operations in Mysuru with government toolkit support.',
        next_steps: [
          'Visit nearest Grama One or Karnataka One centre to register for PM Vishwakarma under the Tailor (Darzi) trade.',
          'Register for the free Self Employed Tailor course at Government ITI for Women in Mysuru.',
          'Complete the basic 5-7 day skill training to receive the ₹15,000 digital toolkit voucher.'
        ],
        limitations: [
          'Toolkit vouchers are disbursed only after successful skill assessment by the Sector Skill Council.'
        ]
      },
      validated_evidence: [
        {
          chunk_id: 'chk-002',
          source_id: 'src-001',
          authority: 'Ministry of MSME, Government of India',
          excerpt: 'PM Vishwakarma Scheme provides holistic end-to-end support to traditional artisans and craftspeople including Darzi (Tailor).',
          page_or_section: 'Scheme Guidelines 2023',
          source_url: 'https://pmvishwakarma.gov.in'
        }
      ],
      explanation_status: 'available',
      evidence_status: 'retrieved'
    }
  },
  {
    id: 'construction-to-fitter',
    name: 'Construction Labourer → Fitter',
    badge: 'Construction to Industrial',
    description: 'Transition from manual construction labor to certified industrial mechanical fitter in Belagavi.',
    initialProfile: {
      occupation: 'Construction Labourer',
      district: 'Belagavi',
      education: 'No Formal Education',
      career_goal_text: 'I want to learn machine fitting and factory technical work',
      language: 'hi',
      age: 28,
      gender: 'Male',
      pincode: '590001',
      latitude: null,
      longitude: null,
      session_id: 'demo-sess-003',
    },
    response: {
      profile: {
        occupation: 'Construction Labourer',
        district: 'Belagavi',
        education: 'No Formal Education',
        career_goal_text: 'I want to learn machine fitting and factory technical work',
        language: 'hi',
        age: 28,
        gender: 'Male',
        pincode: '590001',
        latitude: null,
        longitude: null,
        session_id: 'demo-sess-003',
      },
      matched_occupation: {
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
      recommended_pathways: [
        {
          target_skill: {
            id: 'skl-022',
            name_en: 'Mechanical Fitter / Assembly Technician',
            name_kn: 'ಮೆಕ್ಯಾನಿಕಲ್ ಫಿಟ್ಟರ್',
            name_hi: 'मैकेनिकल फिटर',
            category: 'Manufacturing & Engineering',
            skill_level: 'Level 3'
          },
          bridge_skills: [
            {
              id: 'skl-023',
              name_en: 'Precision Measurement & Bench Work',
              name_kn: 'ನಿಖರ ಅಳತೆ ಮತ್ತು ಬೆಂಚ್ ಕೆಲಸ',
              category: 'Technical',
              skill_level: 'Level 2'
            }
          ],
          rationale: 'Industrial machine manufacturing in Belagavi demands mechanical fitters; your heavy tool handling and stamina translate into industrial machinery assembly.',
          confidence: 'data-driven',
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
          centres: [
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
          ]
        }
      ],
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
          certifying_body: 'DGT / NCVT',
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
        },
        {
          id: 'tc-041',
          name: 'Bailhongal Rural Skill Training Centre',
          district: 'Belagavi',
          taluk: 'Bailhongal',
          address: 'Taluk Office Road, Bailhongal, Belagavi',
          latitude: null,
          longitude: null,
          recognition_status: 'empanelled',
          distance_km: null,
          distance_type: 'none'
        }
      ],
      schemes: [
        {
          id: 'sch-008',
          name_en: 'Karnataka Building & Other Construction Workers Board (KBOCWWB)',
          name_kn: 'ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಮತ್ತು ಇತರೆ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿ',
          name_hi: 'कर्नाटक भवन एवं अन्य सन्निर्माण कर्मकार कल्याण बोर्ड',
          issuing_authority: 'Labour Department, Government of Karnataka',
          scheme_type: 'Welfare & Skill Upgrade Subsidy',
          benefit_summary: 'Toolkits, skill upgradation stipends, accident cover, and scholarship assistance for registered construction workers.',
          official_url: 'https://karbwwb.karnataka.gov.in',
          status: 'active'
        }
      ],
      eligibility: [
        {
          scheme_id: 'sch-008',
          scheme_name: 'KBOCWWB Welfare Benefits & Skill Training',
          verdict: 'eligible',
          reasons: [
            {
              rule_id: 'rule-kboc-01',
              field_path: 'profile.occupation',
              human_readable_condition: 'Engaged in building or construction work for at least 90 days',
              result: 'pass'
            }
          ],
          required_documents: [
            {
              document_id: 'doc-010',
              document_name: '90-day Construction Work Certificate from Registered Contractor/Union',
              mandatory: true
            },
            {
              document_id: 'doc-001',
              document_name: 'Aadhaar Card',
              mandatory: true
            }
          ]
        }
      ],
      documents: [
        {
          document_id: 'doc-001',
          document_name: 'Aadhaar Card',
          mandatory: true
        }
      ],
      evidence_count: 2,
      warnings: [],
      explanation: {
        summary: 'Transitioning from manual site labor to mechanical fitting provides permanent manufacturing employment in Belagavi’s Udyambag foundry and machine cluster.',
        skill_gap_explanation: 'Moving to industrial fitting requires learning precision hand tools, metal grinding, and basic blueprint interpretation.',
        pathway_explanation: 'Government ITI Belagavi offers subsidized practical training with heavy machinery and certified DGT curriculum.',
        next_steps: [
          'Verify your active membership with KBOCWWB or visit the District Labour Office in Belagavi.',
          'Enroll in the Industrial Mechanical Fitter batch at Govt ITI Udyambag.',
          'Utilize KBOCWWB training allowance during the 300-hour vocational course.'
        ],
        limitations: [
          'One centre in Bailhongal does not have verified GPS coordinates; distance calculation is unavailable for that location.'
        ]
      },
      validated_evidence: [
        {
          chunk_id: 'chk-024',
          source_id: 'src-007',
          authority: 'Karnataka Building and Other Construction Workers Welfare Board',
          excerpt: 'Registered construction workers are entitled to full skill development sponsorship and toolkits upon trade completion.',
          page_or_section: 'KBOCWWB Welfare Schemes Act',
          source_url: 'https://karbwwb.karnataka.gov.in'
        }
      ],
      explanation_status: 'available',
      evidence_status: 'retrieved'
    }
  },
  {
    id: 'autorickshaw-to-ev',
    name: 'Auto-Rickshaw Driver → EV Technician',
    badge: 'Transport to Electric Mobility',
    description: 'Transition from commercial auto-rickshaw driving to electric vehicle service technician in Hubballi-Dharwad.',
    initialProfile: {
      occupation: 'Auto-Rickshaw Driver',
      district: 'Dharwad (Hubballi-Dharwad)',
      education: '12th Pass',
      career_goal_text: 'I want to service and maintain electric 3-wheelers and EV batteries',
      language: 'kn',
      age: 34,
      gender: 'Male',
      pincode: '580020',
      latitude: null,
      longitude: null,
      session_id: 'demo-sess-004',
    },
    response: {
      profile: {
        occupation: 'Auto-Rickshaw Driver',
        district: 'Dharwad (Hubballi-Dharwad)',
        education: '12th Pass',
        career_goal_text: 'I want to service and maintain electric 3-wheelers and EV batteries',
        language: 'kn',
        age: 34,
        gender: 'Male',
        pincode: '580020',
        latitude: null,
        longitude: null,
        session_id: 'demo-sess-004',
      },
      matched_occupation: {
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
      recommended_pathways: [
        {
          target_skill: {
            id: 'skl-032',
            name_en: 'Electric Vehicle (EV) Service Technician',
            name_kn: 'ಇವಿ ಸೇವಾ ತಂತ್ರಜ್ಞ',
            name_hi: 'इलेक्ट्रिक वाहन (EV) तकनीशियन',
            category: 'Clean Energy & Automotive',
            skill_level: 'Level 4'
          },
          bridge_skills: [
            {
              id: 'skl-033',
              name_en: 'High Voltage EV Battery Safety & Diagnostics',
              name_kn: 'ಇವಿ ಬ್ಯಾಟರಿ ಸುರಕ್ಷತೆ ಮತ್ತು ತಪಾಸಣೆ',
              category: 'Specialized Technical',
              skill_level: 'Level 3'
            }
          ],
          rationale: 'Rapid conversion of urban fleets to electric autos in Karnataka creates massive local service demand; your mechanical familiarity enables swift upskilling into battery diagnosis.',
          confidence: 'data-driven',
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
          centres: [
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
          ]
        }
      ],
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
          provider: 'KGTTI Hubballi'
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
      schemes: [
        {
          id: 'sch-001',
          name_en: "Chief Minister's Kaushalya Karnataka Yojane (CMKKY)",
          name_kn: 'ಮುಖ್ಯಮಂತ್ರಿಗಳ ಕೌಶಲ್ಯ ಕರ್ನಾಟಕ ಯೋಜನೆ',
          issuing_authority: 'Karnataka Skill Development Corporation',
          benefit_summary: 'Free certified EV technology curriculum and placement linkages across authorized dealership service networks.',
          status: 'active'
        }
      ],
      eligibility: [
        {
          scheme_id: 'sch-001',
          scheme_name: 'CMKKY Emerging Tech Grant',
          verdict: 'eligible',
          reasons: [
            {
              rule_id: 'rule-ev-01',
              field_path: 'profile.education',
              human_readable_condition: 'Minimum 10th/12th qualification for Level 4 curriculum',
              result: 'pass'
            }
          ],
          required_documents: [
            {
              document_id: 'doc-001',
              document_name: 'Aadhaar Card',
              mandatory: true
            },
            {
              document_id: 'doc-012',
              document_name: 'Commercial Driving Badge / DL',
              mandatory: false
            }
          ]
        }
      ],
      documents: [
        {
          document_id: 'doc-001',
          document_name: 'Aadhaar Card',
          mandatory: true
        }
      ],
      evidence_count: 2,
      warnings: [],
      explanation: {
        summary: 'With automotive transition toward electric mobility in North Karnataka, your vehicle operational experience positions you perfectly for EV diagnostics and battery servicing.',
        skill_gap_explanation: 'Key technical gaps are high-voltage safety standards, battery management systems (BMS), and electric motor controller calibration.',
        pathway_explanation: 'KGTTI Hubballi features specialized clean-tech EV laboratories with certified trainers from international partnerships.',
        next_steps: [
          'Visit the KGTTI campus on Gokul Road, Hubballi for course counseling.',
          'Enroll in the ASDC EV Technician module supported by state vocational grants.',
          'Connect with regional EV commercial dealership networks for apprenticeship placement.'
        ],
        limitations: [
          'High-voltage live battery training requires strict compliance with industrial protective safety gear.'
        ]
      },
      validated_evidence: [
        {
          chunk_id: 'chk-019',
          source_id: 'src-019',
          authority: 'Automotive Skills Development Council (ASDC)',
          excerpt: 'ASC/Q1424 qualifications prepare technicians to service electric 2-wheelers, 3-wheelers, and commercial fleet charging infrastructure.',
          page_or_section: 'National Occupational Standards (NOS) ASDC',
          source_url: 'https://asdc.org.in'
        }
      ],
      explanation_status: 'available',
      evidence_status: 'retrieved'
    }
  }
];
