CREATE TABLE `site_assignments` (
	`siteId` int NOT NULL,
	`userId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_assignments_siteId_userId_pk` PRIMARY KEY(`siteId`,`userId`)
);
--> statement-breakpoint
CREATE INDEX `site_assignments_site_idx` ON `site_assignments` (`siteId`);--> statement-breakpoint
CREATE INDEX `site_assignments_user_idx` ON `site_assignments` (`userId`);