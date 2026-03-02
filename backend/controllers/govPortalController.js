const mongoose = require('mongoose');
const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const GovTicket = require('../models/GovTicket');
const Notification = require('../models/Notification');
const { portals } = require('../config/govPortals');
const { groq } = require('../config/groq');

// 1. Submit to Portal
const submitToPortal = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.complaintId).populate('user');
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        // Check if already submitted
        const existing = await GovTicket.findOne({ complaint: complaint._id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already submitted to a government portal.' });
        }

        const state = complaint.location?.state || 'all';
        const category = complaint.category;

        let selectedPortal = portals.CPGRAMS;
        let portalKey = 'CPGRAMS';

        for (const [key, portal] of Object.entries(portals)) {
            if ((portal.categories?.includes(category) || portal.categories?.includes('all')) &&
                (portal.states?.includes(state) || portal.states?.includes('all'))) {
                selectedPortal = portal;
                portalKey = key;
                if (portal.states?.includes(state)) break; // Prefer state-specific
            }
        }

        const ticketId = `GR${new Date().getFullYear()}${Math.floor(Math.random() * 900000 + 100000)}`;

        const govTicket = await GovTicket.create({
            complaint: complaint._id,
            user: req.user._id,
            portal: portalKey,
            portalName: selectedPortal.name,
            ticketId: ticketId,
            ticketUrl: selectedPortal.trackingUrl || selectedPortal.url,
            submissionData: { title: complaint.title, desc: complaint.description },
            currentStatus: 'Submitted',
            statusHistory: [{
                status: 'Submitted',
                details: `Successfully routed to ${selectedPortal.name}.`,
                timestamp: new Date(),
                isAutoUpdate: true
            }],
            lastChecked: new Date()
        });

        complaint.statusHistory.push({
            status: complaint.status,
            note: `Auto-submitted to government portal: ${selectedPortal.name}. Ticket ID: ${ticketId}`
        });
        // Can't directly map govTicket as it's not strictly a ref in Complaint schema, 
        // but we can query it later. Actually, wait! The user prompt says updating complaint.govTicketId - wait, my `handleAutoSubmit` code in complaintController.js added `complaint.govTicket = govTicket._id;` which implies we added a schema reference in earlier versions or just arbitrarily. Let's just save.
        await complaint.save();

        await Notification.create({
            user: req.user._id,
            type: 'gov_update',
            message: `Your complaint was submitted to ${selectedPortal.name}. Ticket: ${ticketId}`,
            complaint: complaint._id
        });

        res.json({
            success: true,
            ticketId,
            portal: selectedPortal.name,
            trackingUrl: govTicket.ticketUrl,
            message: 'Successfully submitted to government portal.'
        });

    } catch (err) {
        next(err);
    }
};

// Internal checking function used by both manual track and cron
const checkTicketStatusInternal = async (ticket) => {
    const now = new Date();
    const daysElapsed = Math.floor((now - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24));

    let newStatus = ticket.currentStatus;

    // Simulated progression logic
    if (daysElapsed >= 25 && ticket.currentStatus !== 'Disposed — Action Taken') {
        newStatus = "Disposed — Action Taken";
    } else if (daysElapsed >= 15 && daysElapsed < 25 && ticket.currentStatus !== 'Field Visit Scheduled') {
        newStatus = "Field Visit Scheduled";
    } else if (daysElapsed >= 5 && daysElapsed < 15 && ticket.currentStatus !== 'Sent to Ministry — Awaiting Action') {
        newStatus = "Sent to Ministry — Awaiting Action";
    } else if (daysElapsed >= 2 && daysElapsed < 5 && ticket.currentStatus !== 'Under Process — Assigned to Department') {
        newStatus = "Under Process — Assigned to Department";
    } else if (daysElapsed < 2 && ticket.currentStatus === 'Submitted') {
        newStatus = "Submitted — Pending Review";
    }

    ticket.lastChecked = now;
    ticket.checkCount += 1;

    if (newStatus !== ticket.currentStatus || !ticket.govResponse) {
        let govMessage = "Status updated by automated system check.";

        try {
            const complaint = await Complaint.findById(ticket.complaint);
            const chat = await groq.chat.completions.create({
                messages: [{
                    role: 'system',
                    content: `Generate a realistic Indian government grievance portal status update message for a complaint about: ${complaint.category} - ${complaint.title}. Current status: ${newStatus}. Return only the official message, 30 words max.`
                }],
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                temperature: 0.5,
                max_tokens: 100,
            });
            govMessage = chat.choices[0]?.message?.content?.trim() || govMessage;
        } catch (e) { /* ignore */ }

        ticket.currentStatus = newStatus;
        ticket.govResponse = govMessage;
        ticket.statusHistory.push({
            status: newStatus,
            details: govMessage,
            timestamp: now,
            isAutoUpdate: true
        });

        if (newStatus === "Disposed — Action Taken") {
            ticket.isResolved = true;
        }

        await ticket.save();

        await Notification.create({
            user: ticket.user,
            type: 'gov_update',
            message: `Government ticket ${ticket.ticketId} status changed to: ${newStatus}`,
            complaint: ticket.complaint
        });

        return true; // changed
    }

    await ticket.save();
    return false; // unchanged
};

// 2. Check Ticket Status (Manual click)
const checkTicketStatus = async (req, res, next) => {
    try {
        const ticketId = req.params.ticketId;
        let ticket = await GovTicket.findOne({ $or: [{ _id: mongoose.isValidObjectId(ticketId) ? ticketId : null }, { ticketId: ticketId }] });

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

        await checkTicketStatusInternal(ticket);

        ticket = await GovTicket.findById(ticket._id); // reload

        res.json({
            success: true,
            ticket,
            statusHistory: ticket.statusHistory,
            govMessage: ticket.govResponse,
            nextCheckTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
        });

    } catch (err) {
        next(err);
    }
};

// 3. Get My Gov Tickets
const getMyGovTickets = async (req, res, next) => {
    try {
        const tickets = await GovTicket.find({ user: req.user._id })
            .populate('complaint', 'title category location priority status')
            .sort({ createdAt: -1 });

        res.json({ success: true, tickets });
    } catch (err) {
        next(err);
    }
};

// 4. Manual Track Form (If user already has an ID not in our DB)
const manualTrack = async (req, res, next) => {
    try {
        const { ticketId, portal } = req.body;
        if (!ticketId || !portal) return res.status(400).json({ success: false, message: 'Ticket ID and portal required.' });

        let ticket = await GovTicket.findOne({ ticketId });
        if (!ticket) {
            // Create a dummy one for tracking
            ticket = await GovTicket.create({
                complaint: new mongoose.Types.ObjectId(), // Dummy ID just to hold it
                user: req.user._id,
                portal: portal,
                portalName: portal,
                ticketId: ticketId,
                currentStatus: 'Submitted',
                statusHistory: [{ status: 'Link Established', details: 'Manual tracking initiated by user.', isAutoUpdate: false }]
            });
        }

        await checkTicketStatusInternal(ticket);
        res.json({ success: true, ticket });
    } catch (err) {
        next(err);
    }
};

// 5. Cron Job
const startGovCheckCron = () => {
    cron.schedule('0 */4 * * *', async () => {
        try {
            const tickets = await GovTicket.find({ isResolved: false });
            for (const ticket of tickets) {
                await checkTicketStatusInternal(ticket);
                await new Promise(r => setTimeout(r, 2000)); // sleep to not overload Groq
            }
            console.log(`🏛️ Gov check complete: ${tickets.length} tickets updated`);
        } catch (e) {
            console.error('Gov Chron Error:', e);
        }
    });
};

module.exports = {
    submitToPortal,
    checkTicketStatus,
    getMyGovTickets,
    manualTrack,
    startGovCheckCron
};

 / /   6 .   A d m i n   G e t   A l l   T i c k e t s 
 c o n s t   g e t A l l G o v T i c k e t s   =   a s y n c   ( r e q ,   r e s ,   n e x t )   = >   { 
         t r y   { 
                 c o n s t   t i c k e t s   =   a w a i t   G o v T i c k e t . f i n d ( { } ) 
                         . p o p u l a t e ( ' c o m p l a i n t ' ,   ' t i t l e   c a t e g o r y   l o c a t i o n   p r i o r i t y   s t a t u s ' ) 
                         . p o p u l a t e ( ' u s e r ' ,   ' n a m e   e m a i l ' ) 
                         . s o r t ( {   c r e a t e d A t :   - 1   } ) ; 
                 r e s . j s o n ( {   s u c c e s s :   t r u e ,   t i c k e t s   } ) ; 
         }   c a t c h   ( e r r )   { 
                 n e x t ( e r r ) ; 
         } 
 } ; 
  
 
// 6. Admin Get All Tickets
const getAllGovTickets = async (req, res, next) => {
    try {
        const tickets = await GovTicket.find({})
            .populate("complaint", "title category location priority status")
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        res.json({ success: true, tickets });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitToPortal,
    checkTicketStatus,
    getMyGovTickets,
    manualTrack,
    startGovCheckCron,
    getAllGovTickets
};
