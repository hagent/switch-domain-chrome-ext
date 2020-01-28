This chrome extenstion is helper for ticketmaster.com Event Detail Page project. It shows instance health check status (commit hash, deployment tag) at the top of the extention popup window and allows to redirect to different environments while staying with the same ticketmaster event. 

Installation:

1. Clone repository (ex. "git clone https://github.com/hagent/EDP-chrome-extention.git" )
2. Copy file `secret-template.js` to `secret.js`, fill in real password for environments
3. Add extension folder to chrome as unpacked extenion


Environment buttons list can be configured in `settings.js`