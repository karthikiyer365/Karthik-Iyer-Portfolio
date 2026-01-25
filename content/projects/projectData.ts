export const projectData: Record<string, string> = {
  "crime-prediction": `# Crime Rate Prediction

## Overview

Machine learning model to predict crime rates based on
socioeconomic and demographic factors.

## Problem Statement

Law enforcement agencies need data-driven approaches to
allocate resources effectively. This project builds a
predictive model to identify high-risk areas.

## Technical Approach

### Data Pipeline
- Ingested data from multiple public sources
- Built ETL pipeline using Python and pandas
- Feature engineering from raw demographic data

### Model Development
- Explored Random Forest, XGBoost, and Neural Networks
- Cross-validation with stratified k-fold
- Hyperparameter tuning with GridSearchCV

### Results
- Achieved **85% accuracy** on holdout test set
- Deployed as REST API using FastAPI
- Dashboard built with Plotly for visualization

## Tech Stack

- **Language:** Python
- **ML:** scikit-learn, XGBoost
- **Data:** pandas, NumPy
- **Viz:** Matplotlib, Plotly
- **API:** FastAPI
- **Deploy:** Docker, AWS Lambda

## Impact

Model is used to inform resource allocation decisions,
helping optimize patrol routes and response times.
`,

  "football-analytics": `# Football Analytics

## Overview

Comprehensive analysis of player performance metrics
and team strategies using match and tracking data.

## Data Sources

- Match event data (passes, shots, tackles)
- Player tracking data (GPS coordinates)
- Historical season statistics

## Analysis Components

### Player Performance
- Expected Goals (xG) calculation
- Pass completion under pressure
- Defensive contribution metrics

### Team Tactics
- Formation analysis
- Pressing intensity measurement
- Ball progression patterns

### Predictive Modeling
- Match outcome prediction
- Player valuation model
- Injury risk assessment

## Tech Stack

- **Language:** Python, R
- **Analysis:** pandas, NumPy, scipy
- **Viz:** Matplotlib, Seaborn
- **ML:** scikit-learn
- **Reports:** Jupyter, R Markdown

## Insights Delivered

- Identified undervalued players for recruitment
- Tactical recommendations based on opponent analysis
- Performance benchmarking across leagues
`,

  "yelp-analysis": `# Yelp Business Analysis

## Overview

Data analysis project exploring factors that contribute
to business success on the Yelp platform.

## Research Questions

1. What factors correlate with high ratings?
2. How does location impact business success?
3. What review patterns predict business longevity?

## Methodology

### Data Processing
- Processed 6M+ reviews and 150K+ businesses
- Text preprocessing and sentiment analysis
- Geographic clustering and mapping

### Analysis Techniques
- Sentiment analysis using NLP
- Geographic clustering with DBSCAN
- Time series analysis of review patterns

### Key Findings
- Response time to reviews correlates with rating improvement
- Businesses in diverse neighborhoods show higher resilience
- Review velocity is a leading indicator of success

## Tech Stack

- **Language:** Python
- **NLP:** NLTK, spaCy
- **Analysis:** pandas, NumPy
- **Viz:** Plotly, Folium
- **Clustering:** scikit-learn

## Deliverables

- Interactive dashboard for business insights
- Recommendation engine for business improvements
- Research paper documenting findings
`,
};
