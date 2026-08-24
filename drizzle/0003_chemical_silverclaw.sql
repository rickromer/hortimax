CREATE TABLE `followups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteId` int NOT NULL,
	`createdBy` int NOT NULL,
	`description` text NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `followups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `followups_site_idx` ON `followups` (`siteId`);--> statement-breakpoint
CREATE INDEX `followups_scheduled_idx` ON `followups` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `followups_status_idx` ON `followups` (`status`);