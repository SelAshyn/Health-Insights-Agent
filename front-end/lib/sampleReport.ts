export const SAMPLE_REPORT_TEXT = `
COMPLETE BLOOD COUNT (CBC) WITH DIFFERENTIAL
Patient: Sample Patient | DOB: 01/15/1985 | Gender: Male
Collection Date: 04/15/2025 | Lab: HealthLab Diagnostics

TEST                    RESULT      REFERENCE RANGE     UNITS   FLAG
------------------------------------------------------------------------
HEMATOLOGY
Hemoglobin              11.2        13.5 - 17.5         g/dL    LOW
RBC Count               4.3         4.5 - 5.9           M/uL    LOW
Hematocrit              38          41 - 53             %       LOW
WBC Count               11.8        4.0 - 11.0          K/uL    HIGH
Platelet Count          285         150 - 400           K/uL    NORMAL

RBC INDICES
MCV                     75          80 - 100            fL      LOW
MCH                     25          27 - 33             pg      LOW
MCHC                    31          32 - 36             g/dL    LOW

BLOOD SUGAR
Fasting Glucose         108         70 - 99             mg/dL   HIGH
HbA1c                   5.9         < 5.7               %       HIGH

LIPID PROFILE
Total Cholesterol       212         < 200               mg/dL   HIGH
LDL Cholesterol         135         < 100               mg/dL   HIGH
HDL Cholesterol         38          > 40                mg/dL   LOW
Triglycerides           180         < 150               mg/dL   HIGH

LIVER FUNCTION
ALT                     62          7 - 56              U/L     HIGH
AST                     48          10 - 40             U/L     HIGH
Bilirubin Total         1.1         0.2 - 1.2           mg/dL   NORMAL

KIDNEY FUNCTION
Creatinine              1.2         0.7 - 1.3           mg/dL   NORMAL
eGFR                    72          > 60                mL/min  NORMAL

THYROID
TSH                     4.8         0.4 - 4.0           mIU/L   HIGH
Free T4                 0.9         0.8 - 1.8           ng/dL   NORMAL

ELECTROLYTES
Sodium                  138         136 - 145           mEq/L   NORMAL
Potassium               3.4         3.5 - 5.1           mEq/L   LOW
Calcium                 9.2         8.5 - 10.5          mg/dL   NORMAL

IRON & VITAMINS
Ferritin                10          12 - 300            ng/mL   LOW
Iron                    52          60 - 170            mcg/dL  LOW
Vitamin D               18          30 - 100            ng/mL   LOW

--- End of Report ---
`;

export const SAMPLE_REPORT_FILENAME = "Sample CBC Report";
