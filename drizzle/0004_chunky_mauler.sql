ALTER TABLE `sites` ADD `publicSubmission` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `sites_publicSubmission_idx` ON `sites` (`publicSubmission`);
