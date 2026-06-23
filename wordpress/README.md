# YalaByte WordPress Demo Themes

These themes are installable WordPress packages corresponding to the live React portfolio previews.

## Install

1. Zip the individual theme folder, or use the prepared ZIP in `wordpress/packages/`.
2. In WordPress, open **Appearance → Themes → Add New → Upload Theme**.
3. Upload and activate the theme.
4. Activation creates the starter pages, assigns the homepage, and builds the primary menu.
5. Edit all starter copy through **Pages** and add journal articles through **Posts**.

## Themes

- `aster-travel`: Home, Journeys, Destinations, About, Journal, and Plan a Trip.
- `morrow-cafe`: Home, Menu, Our Story, Visit, and Contact.
- `northstar-logistics`: Home, Services, Coverage, Tracking, Company, and Get a Quote.

## Local WordPress preview

With Docker installed, run this from the `wordpress` directory:

```bash
docker compose up -d
```

Open `http://localhost:8080`, complete WordPress's short setup screen, then activate a demo theme under **Appearance → Themes**. The local WordPress files and database are stored in Docker volumes.

The demo contact forms in the React preview are visual examples. For production WordPress forms, connect a form plugin or CRM chosen for the client.
