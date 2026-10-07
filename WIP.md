# WIP: Content Coverage Across Platforms

Internal working doc. Not hosted. Lives in repo root only (outside `content/` and `public/`, so the site never loads or serves it).

Snapshot: 2026-10-07. One row per item, deduplicated across platforms. Blank = not present.

- **Portfolio**: notebooks under `content/` (karthikiyer.info)
- **Projects + Sports**: `projects.karthikiyer.info` or `sports.karthikiyer.info`
- **Writing**: `writing.karthikiyer.info`
- **Webpage/Github**: what the notebook's `github_url` points to. `Webpage` = live site or demo page (button reads "Go Live!!"), `GitHub` = repo or file on github.com (button reads "View on GitHub"), `None` = notebook exists but has no link. Blank = no notebook yet.

| Item | Portfolio | Projects + Sports | Writing | Webpage/Github |
|---|:-:|:-:|:-:|:-:|
| Soccer Player Analysis | ✓ | ✓ | ✓ | Webpage |
| Soccer Match Center | ✓ | ✓ | ✓ | Webpage |
| Soccer Team Analysis | ✓ | ✓ | ✓ | Webpage |
| MLB Pitcher Perfect | | ✓ | | |
| Leicester 2015/16 VAEP | ✓ | ✓ | ✓ | Webpage |
| Indian EcoPolitical Growth | ✓ | ✓ | | Webpage |
| Demand Forecasting | ✓ | ✓ | ✓ | Webpage |
| Support Ticket Classifier | ✓ | ✓ | ✓ | Webpage |
| E-commerce Sales Dashboard | | ✓ | | |
| WESAD Stress Detection | ✓ | | | GitHub |
| Audio Similarity Recommender | ✓ | | | Webpage |
| Crime Risk Modeling | ✓ | | | GitHub |
| Google Play Store Analytics | ✓ | | | None |
| Yelp Analytics | ✓ | | | GitHub |
| IPL Analytics | ✓ | | | GitHub |
| Sports Analytics Dashboard | ✓ | | | GitHub |
| Train Scheduling Analysis | ✓ | | | None |
| Gov Employee Salary Analysis | ✓ | | | GitHub |

## Notes

- Soccer rows: the single SportSignal portfolio notebook covers all three, and its link now points to `sports.karthikiyer.info`. The "Football data was split" article is the pipeline behind all three.
- Leicester VAEP is tied to the sports site's Team Analysis page (confirmed by owner). Its notebook links to that page.
- Google Play Store Analytics and the MSc notebook had links to the private `storage` repo (404 for visitors); dropped.
- Excluded: in-progress sports sections (Scouting Screens, Bat Tracking, Stuff+/Pitching+, Hitter Analysis).
- MLB Pitcher Perfect Portfolio left blank: not confirmed that the SportSignal notebook covers baseball.
