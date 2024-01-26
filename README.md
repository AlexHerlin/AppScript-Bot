# Presentation of the MAIL BOT with AppScript
## Context
In the context of the thermal rehabilitation of housing, we are required to work with a large volume of data.
The Rénov' Makers operation aims to **rehabilitate 6000 homes in two years**. The thermal data of these homes are updated through the DPE (energy performance diagnosis).

These DPEs come in two forms:
- a .pdf format intended for individuals
- a .xml format intended for data exploitation (especially for the [ADEME](https://observatoire-dpe-audit.ademe.fr/accueil))

## Needs
Until now, the integration of these data was done manually. We received a folder containing 150 DPEs, opened each DPE one by one to extract the information to our Google Sheet information table.
Although this task was basic, it proved to be extremely time-consuming. That's why I set up this macro.

## Presentation of the macro
### Automatic sorting of emails
All the diagnostics are received in a mailbox. However, it is necessary to sort the emails to identify only the thermal diagnostics (we do not want to process asbestos diagnostics, for example).

This macro is written in the file *Classement.js*
Emails are sorted according to the names of the associated attachments (the file names are standardized, allowing the use of regex).

### Reading and integrating data
Once the emails are sorted, they need to be exploited. This is handled by the *integration_mail.js* macro:

1. Loading attachments into a specific Google Drive folder for archiving
2. Reading the data from the .xml file (macro *extraction_xml.js*) and identifying the associated housing
3. Constructing the update request (use of the Google Sheets API for speed reasons)
4. Data integration

## Main problems and technical challenge to overcome
App script cannot execute a script for more than 5 minutes. Therefore, the macros must be optimized to be able to execute properly.
That is why all the scripts limit as much as possible the number of requests sent to the Google server, especially regarding the Google Sheets data update.

---
