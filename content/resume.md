# Karthik Sivaraman Iyer

**DATA ANALYST**  
Arlington, VA  
📧 karthikiyer365@gmail.com · 📞 +1 (202) 713‑1699  
🔗 [linkedin.com/in/kiyer8](https://linkedin.com/in/kiyer8)

---

## 🧭 Professional Snapshot
```text
Data Analyst with strong foundations in statistical modeling, data engineering, and applied machine learning.
Experienced in translating messy, large‑scale data into actionable insights across education, finance, and analytics‑driven research.
```

---

## 🎓 Education

### George Washington University — Washington, DC, USA  
**Master of Science in Data Analytics** · *GPA: 3.68*  
_Aug 2023 — May 2025_

**Relevant Coursework**  
Probabilistic Analysis · Quantitative Analysis · Data Wrangling · Data Manipulation · Data Pipelines · NLP

---

### University of Mumbai — Mumbai, MH, India  
**Bachelor of Engineering in Computer Engineering** · *GPA: 3.6*  
_Aug 2018 — May 2022_

**Relevant Coursework**  
Image Processing · Relational Database Management · Website Development · Data Structures & Algorithms

---

## 🧠 Skills

```text
skills/
├── programming/
│   ├── python
│   ├── sql
│   ├── r
│   ├── c
│   ├── html
│   ├── css
│   └── javascript
│
├── data-management/
│   ├── postgresql
│   ├── mysql
│   ├── mongodb
│   └── spark
│
├── data-visualization/
│   ├── tableau
│   ├── power-bi
│   ├── excel
│   ├── sas
│   ├── minitab
│   ├── matplotlib
│   ├── seaborn
│   ├── plotly-js
│   └── dash
│
├── cloud-platforms/
│   ├── aws/
│   │   ├── ec2
│   │   ├── iam
│   │   └── s3
│   └── gcp/
│       ├── cloud-sql
│       ├── databricks
│       ├── looker-studio
│       └── docker
│
└── certifications/
    ├── google-analytics-ga4
    └── azure-ml-pipelines
```

---


## 💼 Experience

### Student Assistant — Systems Administration  
**George Washington University** · Washington, DC  
_Aug 2024 — Present_

- Resolved **30+ technical tickets** across macOS, Windows, and Linux for 10+ applications, achieving a **97% resolution rate**
- Supported inventory audits and demand forecasting using **BMC Helix**, improving operational success to **89%**
- Maintained transparent communication with students and faculty, driving **90% customer satisfaction**

---

### Teaching Assistant — Probability & Decision Making with Data  
**George Washington University** · Washington, DC  
_Sep 2024 — Dec 2024_

- Built an **auto‑grading system** using Python, NLP, BERT, and Excel, saving **10+ faculty hours/week**
- Collaborated with 3 faculty members to refine grading logic, improving consistency by **25%**
- Centralized evaluation workflows for **400+ assignments**, reducing turnaround time by **60%**
- Led weekly 3‑hour student sessions simplifying probabilistic and statistical concepts

---

### Financial Analyst Intern  
**DPSY & Associates** · Mumbai, India  
_Apr 2023 — Jun 2023_

- Analyzed the **$85B+ diamond market**, identifying seasonal pricing shifts (28% → 37%) to inform inventory strategy
- Automated reconciliation workflows with **Excel macros, VLOOKUPs, and Pivot Tables**, reducing effort by **25%**
- Contributed to **24‑month LMS audit reports**, identifying **20 compliance discrepancies**
- Built **SQL‑based ETL pipelines** (SSAS) ensuring audit integrity across **5M+ accounts**

---

## 🧪 Technical Projects

### Audio Similarity‑Based Artist Recommendation *(Research)*  
_Mar 2024 — Jun 2024_

- Scraped and transformed NoSQL music metadata using **BeautifulSoup + Regex**, generating **20K+ artists/week**
- Extracted MFCC audio features from WAV files and applied **PCA on 20 dimensions**
- Implemented SVC classification using **GTZAN**, achieving **74% accuracy** and **97% AUC**

---

### Drug User Classification — Crime Data Analysis  
_Oct 2023 — Dec 2023_

- Conducted EDA and PCA to isolate **6 socio‑economic predictors** for classification models
- Built **Random Forest & Logistic Regression** models; Logistic Regression achieved **70% recall**
- Applied categorical encoding, log transforms, and interaction terms, improving recall by **10%**

---

### Soccer Player Data Dashboard  
_Jan 2023 — May 2023_

- Analyzed **100K+ players** across 5+ seasons and defined **4 performance KPIs**
- Deployed an interactive **Dash + Plotly** dashboard for time‑series and comparative analysis
- Produced a comprehensive report with **20+ visualizations** and actionable insights

---

## 🗺️ Career Path

```mermaid
flowchart TB

    %% Education Column
    subgraph EDU[Education]
        E1[2018–2022
B.E. Computer Engineering]
        E2[2023–2025
M.S. Data Analytics]
        E1 --> E2
    end

    %% Experience Column
    subgraph EXP[Experience]
        X1[2023
Financial Analyst Intern]
        X2[2024
Teaching Assistant]
        X3[2024–Present
Systems Assistant]
        X4[Future
Data Systems Engineer]
        X1 --> X2 --> X3 --> X4
    end

    %% Projects Column
    subgraph PROJ[Projects]
        P1[Soccer Player Evaluation Dashboard]
        P2[Crime Data
Drug User Classification]
        P3[Audio Similarity
ML Research]
        P4[Diamond Market
EDA]
    end

    %% Cross-links (timeline logic)
    E1 --> X1
    E2 --> X2
    E2 --> P2
    E2 --> P3
    X1 --> P4
    X3 --> P1

```

---
mermaid
erDiagram
	direction TB
	CONSENT_EVENTS {
		UUID consent_event_id PK ""  
		UUID party_id FK ""  
		VARCHAR event_type  ""  
		VARCHAR keyword  ""  
		VARCHAR event_source  ""  
		TIMESTAMP event_timestamp  ""  
		VARCHAR opt_in_source  ""  
		VARCHAR a2p_campaign_id  ""  
		VARCHAR recorded_by  ""  
		TEXT notes  ""  
	}

	INTERACTIONS {
		UUID interaction_id PK ""  
		UUID party_id FK ""  
		UUID correlation_id  ""  
		VARCHAR session_id  ""  
		TIMESTAMP start_time  ""  
		channel_type channel  ""  
		message_direction direction  ""  
		VARCHAR locale  ""  
		JSONB metadata  ""  
		TIMESTAMP last_updated  ""  
	}

	SMS_MESSAGES {
		UUID message_id PK ""  
		UUID interaction_id FK ""  
		UUID party_id FK ""  
		TIMESTAMP message_timestamp  ""  
		VARCHAR from_number  ""  
		VARCHAR to_number  ""  
		TEXT raw_text  ""  
		TEXT transcript  ""  
		TEXT[] media_urls  ""  
		message_status status  ""  
		VARCHAR provider_message_id  ""  
		VARCHAR provider_signature  ""  
		JSONB event_payload  ""  
		VARCHAR idempotency_key  ""  
		TIMESTAMP created_at  ""  
	}

	CALLS {
		UUID call_id PK ""  
		UUID interaction_id FK ""  
		UUID party_id FK ""  
		TIMESTAMP call_timestamp  ""  
		VARCHAR call_session_id  ""  
		VARCHAR from_number  ""  
		VARCHAR to_number  ""  
		INTEGER duration_seconds  ""  
		TEXT raw_audio_url  ""  
		TEXT transcript  ""  
		call_status status  ""  
		TEXT ivr_script_response  ""  
		JSONB metadata  ""  
		VARCHAR idempotency_key  ""  
		TIMESTAMP created_at  ""  
	}

	NLP_EVENTS {
		UUID nlp_event_id PK ""  
		UUID interaction_id FK ""  
		UUID message_id FK ""  
		UUID call_id FK ""  
		TIMESTAMP nlp_timestamp  ""  
		VARCHAR intent  ""  
		JSONB entities  ""  
		NUMERIC confidence  ""  
		VARCHAR model_version  ""  
		JSONB router_output  ""  
		TIMESTAMP created_at  ""  
	}

	AUTH_SESSIONS {
		UUID auth_session_id PK ""  
		UUID party_id FK ""  
		VARCHAR session_id  ""  
		auth_method verification_method  ""  
		VARCHAR phone_number  ""  
		VARCHAR email  ""  
		VARCHAR code_hash  ""  
		auth_status status  ""  
		TIMESTAMP created_at  ""  
		TIMESTAMP expires_at  ""  
		TIMESTAMP verified_at  ""  
		JSONB metadata  ""  
	}

	ACTIONS {
		UUID action_id PK ""  
		UUID interaction_id FK ""  
		UUID nlp_event_id FK ""  
		TIMESTAMP action_timestamp  ""  
		VARCHAR target_system  ""  
		VARCHAR operation  ""  
		JSONB parameters  ""  
		BOOLEAN dry_run  ""  
		action_status status  ""  
		TIMESTAMP created_at  ""  
	}

	RESULTS {
		UUID result_id PK ""  
		UUID action_id FK ""  
		UUID interaction_id FK ""  
		TIMESTAMP result_timestamp  ""  
		result_status status  ""  
		TEXT artifact_url  ""  
		TEXT summary  ""  
		VARCHAR error_code  ""  
		TEXT error_message  ""  
		VARCHAR handoff_ticket_id  ""  
		TIMESTAMP created_at  ""  
	}

	ROUTING_EVENTS {
		UUID routing_event_id PK ""  
		UUID interaction_id FK ""  
		UUID nlp_event_id FK ""  
		TIMESTAMP routing_timestamp  ""  
		VARCHAR queue  ""  
		INTEGER priority  ""  
		VARCHAR agent_id  ""  
		TIMESTAMP routed_at  ""  
		TEXT route_notes  ""  
	}

	COMPLIANCE_RECORDS {
		UUID compliance_id PK ""  
		UUID interaction_id FK ""  
		UUID party_id FK ""  
		TIMESTAMP recorded_at  ""  
		VARCHAR opt_in_source  ""  
		JSONB keyword_events  ""  
		VARCHAR a2p_campaign_id  ""  
		TEXT notes  ""  
	}

	IDEMPOTENCY_KEYS {
		VARCHAR idempotency_key PK ""  
		TIMESTAMP created_at  ""  
		TIMESTAMP last_seen_at  ""  
		TEXT description  ""  
	}

	CORRELATION_MAPPING {
		UUID correlation_id PK ""  
		VARCHAR service_name PK ""  
		UUID event_id PK ""  
		VARCHAR event_table  ""  
		TIMESTAMP created_at  ""  
	}

	Untitled-Entity {

	}

	EMPLOYEE {
		UUID party_id PK ""  
		VARCHAR external_user_id  ""  
		VARCHAR phone_number  ""  
		VARCHAR phone_number_hash  ""  
		consent_status consent_status  ""  
		VARCHAR locale  ""  
		TIMESTAMP created_at  ""  
		TIMESTAMP updated_at  ""  
	}

	EMPLOYEE||--o{CONSENT_EVENTS:"party_id"
	EMPLOYEE||--o{INTERACTIONS:"party_id"
	EMPLOYEE||--o{SMS_MESSAGES:"party_id"
	EMPLOYEE||--o{CALLS:"party_id"
	EMPLOYEE||--o{AUTH_SESSIONS:"party_id"
	EMPLOYEE||--o{COMPLIANCE_RECORDS:"party_id"
	INTERACTIONS||--o{SMS_MESSAGES:"interaction_id"
	INTERACTIONS||--o{CALLS:"interaction_id"
	INTERACTIONS||--o{NLP_EVENTS:"interaction_id"
	INTERACTIONS||--o{ACTIONS:"interaction_id"
	INTERACTIONS||--o{RESULTS:"interaction_id"
	INTERACTIONS||--o{ROUTING_EVENTS:"interaction_id"
	INTERACTIONS||--o{COMPLIANCE_RECORDS:"interaction_id"
	SMS_MESSAGES||--o{NLP_EVENTS:"message_id"
	CALLS||--o{NLP_EVENTS:"call_id"
	NLP_EVENTS||--o{ACTIONS:"nlp_event_id"
	ACTIONS||--o{RESULTS:"action_id"
	NLP_EVENTS||--o{ROUTING_EVENTS:"nlp_event_id"
	INTERACTIONS||--o{CORRELATION_MAPPING:"correlation_id"
	NLP_EVENTS}|--|{Untitled-Entity:"  "


```

---

## 🔚 End of File
```yaml
languages:
  - English
  - French
  - Hindi
  - Tamil
  - Marathi

hobbies:
  - Football
  - Data exploration
  - Leadership

leadership:
  - IEEE Executive Member – Region 10 (Asia Pacific) | 2018–2023
  - SIES Model United Nations
```

