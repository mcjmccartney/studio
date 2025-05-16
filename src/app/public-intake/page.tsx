
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { addClientToFirestore } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const intakeFormSchema = z.object({
  name: z.string().min(2, { message: "Your name must be at least 2 characters." }),
  dogName: z.string().min(1, { message: "Your dog's name is required." }),
  dogBreed: z.string().min(2, { message: "Your dog's breed must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  contactPhone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  behaviorHistory: z.string().optional(),
});

type IntakeFormValues = z.infer<typeof intakeFormSchema>;

export default function PublicIntakePage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
  });

  const handleFormSubmit: SubmitHandler<IntakeFormValues> = async (data) => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      toast({
        title: "Service Unavailable",
        description: "The form submission service is temporarily unavailable. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const clientDataForFirestore: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'> = data;
      await addClientToFirestore(clientDataForFirestore);
      toast({
        title: "Submission Successful!",
        description: "Thank you for submitting your information. We will be in touch shortly.",
      });
      reset();
    } catch (err) {
      console.error("Error submitting intake form to Firestore:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({
        title: "Submission Error",
        description: `There was a problem submitting your form: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">New Client Intake Form</CardTitle>
          <CardDescription>
            Please fill out the form below so we can learn more about you and your dog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Full Name</Label>
                <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} disabled={isSubmitting} placeholder="e.g., Jane Doe" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email Address</Label>
                <Input id="contactEmail" type="email" {...register("contactEmail")} className={errors.contactEmail ? "border-destructive" : ""} disabled={isSubmitting} placeholder="e.g., jane.doe@example.com" />
                {errors.contactEmail && <p className="text-xs text-destructive mt-1">{errors.contactEmail.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dogName">Dog&apos;s Name</Label>
                <Input id="dogName" {...register("dogName")} className={errors.dogName ? "border-destructive" : ""} disabled={isSubmitting} placeholder="e.g., Buddy" />
                {errors.dogName && <p className="text-xs text-destructive mt-1">{errors.dogName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dogBreed">Dog&apos;s Breed</Label>
                <Input id="dogBreed" {...register("dogBreed")} className={errors.dogBreed ? "border-destructive" : ""} disabled={isSubmitting} placeholder="e.g., Golden Retriever" />
                {errors.dogBreed && <p className="text-xs text-destructive mt-1">{errors.dogBreed.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone Number</Label>
              <Input id="contactPhone" type="tel" {...register("contactPhone")} className={errors.contactPhone ? "border-destructive" : ""} disabled={isSubmitting} placeholder="e.g., (555) 123-4567" />
              {errors.contactPhone && <p className="text-xs text-destructive mt-1">{errors.contactPhone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="behaviorHistory">Behavior History & Training Goals</Label>
              <Textarea 
                id="behaviorHistory" 
                {...register("behaviorHistory")} 
                placeholder="Optional: Tell us about any specific behaviors your dog exhibits, any past training, and what you hope to achieve." 
                rows={5} 
                disabled={isSubmitting}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Intake Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-xs text-muted-foreground text-center max-w-md">
        By submitting this form, you agree to our terms of service and privacy policy. 
        We will use your information to contact you regarding your inquiry.
      </p>
    </div>
  );
}
