CREATE TABLE `site_archive_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`actorId` int NOT NULL,
	`action` enum('archived','restored') NOT NULL,
	`reason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_archive_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sites` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sites` ADD `archivedBy` int;--> statement-breakpoint
ALTER TABLE `sites` ADD `archiveReason` varchar(500);--> statement-breakpoint
CREATE INDEX `site_archive_events_site_idx` ON `site_archive_events` (`siteId`);--> statement-breakpoint
CREATE INDEX `site_archive_events_actor_idx` ON `site_archive_events` (`actorId`);