<script>
    import './adminNav.css';
    import 'iconify-icon';
    
</script>

<div class="sidebarNav">
    <section class="orgPfp">
        <div class="infoLine">
            <img src="https://picsum.photos/50" alt="pfp Placeholder">
            <p>[ORG NAME]</p>
        </div>
        <p>Org Since: [YEAR]</p>
        <p>Members: [MEMBER COUNT]</p>
    </section>
    <section class="buttons">
        <ul>
            <li>
                <iconify-icon icon="fa7-solid:house-chimney" width="30px" height="30px"></iconify-icon>
                <a href="/adminHome">Home</a>
            </li>
            <li>
                <iconify-icon icon="mdi:calendar" width="30px" height="30px"></iconify-icon>
                <a href="/adminEventCalendar">Event Calendar</a>
            </li>
            <li>
                <iconify-icon icon="mdi:event-add" width="30" height="30"></iconify-icon>
                <a href="/adminNewEvent">New Event</a>
            </li>
            <li>
                <iconify-icon icon="streamline:announcement-megaphone-remix" width="30" height="30"></iconify-icon>
                <a href="/adminNewAnnouncement">New Announcement</a>
            </li>
            <li>
                <iconify-icon icon="majesticons:users-line" width="30" height="30"></iconify-icon>
                <a href="/adminMemberList">Member List</a>
            </li>
            <li class="logoutButton" id="adminLogout">
                <iconify-icon icon="ic:round-exit-to-app" width="30" height="30"></iconify-icon>
                <span>Log Out</span>
            </li>
        </ul>
    </section>
</div>
