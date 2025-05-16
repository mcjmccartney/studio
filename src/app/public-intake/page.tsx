
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { addClientToFirestore } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const behaviouralBriefSchema = z.object({
  // Your Details
  name: z.string().min(2, { message: "Your full name must be at least 2 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  contactPhone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  address: z.string().min(5, { message: "Address is required." }),
  preferredContactMethod: z.enum(['Email', 'Phone'], { required_error: "Preferred contact method is required." }),
  referralSource: z.string().optional(),

  // Dog's Details
  dogName: z.string().min(1, { message: "Dog's name is required." }),
  dogBreed: z.string().min(2, { message: "Dog's breed (or best guess) is required." }),
  dogAge: z.string().min(1, { message: "Dog's age is required." }),
  dogSex: z.enum(['Male', 'Female'], { required_error: "Dog's sex is required." }),
  dogNeutered: z.enum(['Yes', 'No'], { required_error: "Please specify if your dog is neutered." }),
  dogOrigin: z.enum(['Breeder', 'Rescue (UK)', 'Rescue (Abroad)', 'Other'], { required_error: "Origin of dog is required." }),
  dogOriginOther: z.string().optional(),
  dogAcquisitionDuration: z.string().min(1, { message: "Duration of ownership is required." }),
  
  livesWithOtherDogs: z.enum(['Yes', 'No'], { required_error: "This field is required." }),
  otherDogsDetails: z.string().optional(),
  livesWithCats: z.enum(['Yes', 'No'], { required_error: "This field is required." }),
  catsDetails: z.string().optional(),
  livesWithChildren: z.enum(['Yes', 'No'], { required_error: "This field is required." }),
  childrenDetails: z.string().optional(),
  visitingChildren: z.enum(['Yes', 'No'], { required_error: "This field is required." }),
  visitingChildrenDetails: z.string().optional(),
  otherHouseholdMembers: z.string().optional(),

  // Behavioural Information
  behaviouralProblemsDescription: z.string().min(10, { message: "Please describe the behavioural problem(s) in detail (min 10 characters)." }),
  problemStartDate: z.string().min(1, { message: "Start date of problem behaviour is required." }),
  problemFrequency: z.string().min(1, { message: "Frequency of problem behaviour is required." }),
  problemSituations: z.string().min(1, { message: "Situations where behaviour occurs is required." }),
  problemTriggers: z.string().optional(),
  previousSolutions: z.string().optional(),
  dogAggression: z.enum(['Yes', 'No'], { required_error: "Please specify if your dog has shown aggression." }),
  dogAggressionDetails: z.string().optional(),
  trainingGoals: z.string().min(5, { message: "Training goals are required." }),

  // Health & Lifestyle
  dailyRoutine: z.string().min(5, { message: "Daily routine description is required." }),
  dailyExercise: z.string().min(1, { message: "Amount of daily exercise is required." }),
  exerciseType: z.string().min(1, { message: "Type of exercise is required." }),
  dogFoodType: z.string().min(1, { message: "Dog's food type is required." }),
  healthProblemsAllergies: z.string().optional(),
  lastVetCheck: z.string().optional(),
  currentMedication: z.string().optional(),
  pastInjuriesSurgeries: z.string().optional(),

  // Training & Socialisation
  attendedTrainingClasses: z.enum(['Yes', 'No'], { required_error: "This field is required." }),
  trainingClassesDetails: z.string().optional(),
  socialisationWithDogs: z.string().optional(),
  socialisationWithPeople: z.string().optional(),

  // Consent & Agreement
  vetConsent: z.boolean().refine(val => val === true, { message: "You must consent to vet contact if necessary." }),
  commitmentConsent: z.boolean().refine(val => val === true, { message: "You must acknowledge the commitment involved." }),
  termsConsent: z.boolean().refine(val => val === true, { message: "You must agree to the terms and conditions." }),
  signature: z.string().min(2, { message: "Signature (full name) is required." }),
  submissionDate: z.string(), // Will be auto-filled
})
.refine(data => data.dogOrigin !== 'Other' || (data.dogOrigin === 'Other' && data.dogOriginOther && data.dogOriginOther.trim() !== ''), {
  message: "Please specify 'Other' origin if selected.",
  path: ["dogOriginOther"],
})
.refine(data => data.livesWithOtherDogs !== 'Yes' || (data.livesWithOtherDogs === 'Yes' && data.otherDogsDetails && data.otherDogsDetails.trim() !== ''), {
  message: "Please provide details if your dog lives with other dogs.",
  path: ["otherDogsDetails"],
})
.refine(data => data.livesWithCats !== 'Yes' || (data.livesWithCats === 'Yes' && data.catsDetails && data.catsDetails.trim() !== ''), {
  message: "Please provide details if your dog lives with cats.",
  path: ["catsDetails"],
})
.refine(data => data.livesWithChildren !== 'Yes' || (data.livesWithChildren === 'Yes' && data.childrenDetails && data.childrenDetails.trim() !== ''), {
  message: "Please provide details if your dog lives with children.",
  path: ["childrenDetails"],
})
.refine(data => data.visitingChildren !== 'Yes' || (data.visitingChildren === 'Yes' && data.visitingChildrenDetails && data.visitingChildrenDetails.trim() !== ''), {
  message: "Please provide details if there are visiting children.",
  path: ["visitingChildrenDetails"],
})
.refine(data => data.dogAggression !== 'Yes' || (data.dogAggression === 'Yes' && data.dogAggressionDetails && data.dogAggressionDetails.trim() !== ''), {
  message: "Please describe aggression incidents if 'Yes' is selected.",
  path: ["dogAggressionDetails"],
})
.refine(data => data.attendedTrainingClasses !== 'Yes' || (data.attendedTrainingClasses === 'Yes' && data.trainingClassesDetails && data.trainingClassesDetails.trim() !== ''), {
  message: "Please describe training classes if 'Yes' is selected.",
  path: ["trainingClassesDetails"],
});


type BehaviouralBriefFormValues = z.infer<typeof behaviouralBriefSchema>;

export default function BehaviouralBriefPage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<BehaviouralBriefFormValues>({
    resolver: zodResolver(behaviouralBriefSchema),
    defaultValues: {
      submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      vetConsent: false,
      commitmentConsent: false,
      termsConsent: false,
    }
  });

  const watchDogOrigin = watch("dogOrigin");
  const watchLivesWithOtherDogs = watch("livesWithOtherDogs");
  const watchLivesWithCats = watch("livesWithCats");
  const watchLivesWithChildren = watch("livesWithChildren");
  const watchVisitingChildren = watch("visitingChildren");
  const watchDogAggression = watch("dogAggression");
  const watchAttendedTrainingClasses = watch("attendedTrainingClasses");

  const handleFormSubmit: SubmitHandler<BehaviouralBriefFormValues> = async (data) => {
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
      // Ensure all data conforms to Client type for Firestore
      const clientDataForFirestore: Omit<Client, 'id' | 'lastSession' | 'nextSession' | 'createdAt'> = {
        name: data.name,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        dogName: data.dogName,
        dogBreed: data.dogBreed,
        // Add all new fields here
        address: data.address,
        preferredContactMethod: data.preferredContactMethod,
        referralSource: data.referralSource,
        dogAge: data.dogAge,
        dogSex: data.dogSex,
        dogNeutered: data.dogNeutered,
        dogOrigin: data.dogOrigin,
        dogOriginOther: data.dogOriginOther,
        dogAcquisitionDuration: data.dogAcquisitionDuration,
        livesWithOtherDogs: data.livesWithOtherDogs,
        otherDogsDetails: data.otherDogsDetails,
        livesWithCats: data.livesWithCats,
        catsDetails: data.catsDetails,
        livesWithChildren: data.livesWithChildren,
        childrenDetails: data.childrenDetails,
        visitingChildren: data.visitingChildren,
        visitingChildrenDetails: data.visitingChildrenDetails,
        otherHouseholdMembers: data.otherHouseholdMembers,
        behaviouralProblemsDescription: data.behaviouralProblemsDescription,
        problemStartDate: data.problemStartDate,
        problemFrequency: data.problemFrequency,
        problemSituations: data.problemSituations,
        problemTriggers: data.problemTriggers,
        previousSolutions: data.previousSolutions,
        dogAggression: data.dogAggression,
        dogAggressionDetails: data.dogAggressionDetails,
        trainingGoals: data.trainingGoals,
        dailyRoutine: data.dailyRoutine,
        dailyExercise: data.dailyExercise,
        exerciseType: data.exerciseType,
        dogFoodType: data.dogFoodType,
        healthProblemsAllergies: data.healthProblemsAllergies,
        lastVetCheck: data.lastVetCheck,
        currentMedication: data.currentMedication,
        pastInjuriesSurgeries: data.pastInjuriesSurgeries,
        attendedTrainingClasses: data.attendedTrainingClasses,
        trainingClassesDetails: data.trainingClassesDetails,
        socialisationWithDogs: data.socialisationWithDogs,
        socialisationWithPeople: data.socialisationWithPeople,
        vetConsent: data.vetConsent,
        commitmentConsent: data.commitmentConsent,
        termsConsent: data.termsConsent,
        signature: data.signature,
        submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      };

      await addClientToFirestore(clientDataForFirestore);
      toast({
        title: "Submission Successful!",
        description: "Thank you for submitting your Behavioural Brief. We will be in touch shortly.",
      });
      reset({submissionDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"), vetConsent: false, commitmentConsent: false, termsConsent: false, name: '', contactEmail: '', contactPhone: '', address: '', dogName: '', dogBreed: '', dogAge: '' /* reset other fields as needed */});
    } catch (err) {
      console.error("Error submitting behavioural brief to Firestore:", err);
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

  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <>
      <Separator className="my-6" />
      <h2 className="text-xl font-semibold mb-4 text-primary">{title}</h2>
    </>
  );
  
  const FormField: React.FC<{ label: string; htmlFor: keyof BehaviouralBriefFormValues, error?: string, children: React.ReactNode, required?: boolean }> = ({ label, htmlFor, error, children, required }) => (
    <div className="space-y-2 mb-4">
      <Label htmlFor={htmlFor}>{label}{required && <span className="text-destructive">*</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Behavioural Brief</CardTitle>
          <CardDescription>
            Please fill out the form below so we can learn more about you and your dog. Fields marked with <span className="text-destructive">*</span> are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            
            <SectionTitle title="Your Details" />
            <FormField label="Full Name" htmlFor="name" error={errors.name?.message} required>
              <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Email Address" htmlFor="contactEmail" error={errors.contactEmail?.message} required>
              <Input id="contactEmail" type="email" {...register("contactEmail")} className={errors.contactEmail ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Phone Number" htmlFor="contactPhone" error={errors.contactPhone?.message} required>
              <Input id="contactPhone" type="tel" {...register("contactPhone")} className={errors.contactPhone ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Address" htmlFor="address" error={errors.address?.message} required>
              <Textarea id="address" {...register("address")} className={errors.address ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
            </FormField>
            <FormField label="Best way to contact you?" htmlFor="preferredContactMethod" error={errors.preferredContactMethod?.message} required>
              <Controller
                name="preferredContactMethod"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Email" id="contactEmailRadio" /><Label htmlFor="contactEmailRadio">Email</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Phone" id="contactPhoneRadio" /><Label htmlFor="contactPhoneRadio">Phone</Label></div>
                  </RadioGroup>
                )}
              />
            </FormField>
            <FormField label="How did you hear about Raising My Rescue?" htmlFor="referralSource" error={errors.referralSource?.message}>
              <Input id="referralSource" {...register("referralSource")} disabled={isSubmitting} />
            </FormField>

            <SectionTitle title="Your Dog's Details" />
            <FormField label="Dog's Name" htmlFor="dogName" error={errors.dogName?.message} required>
              <Input id="dogName" {...register("dogName")} className={errors.dogName ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Dog's Breed (or best guess)" htmlFor="dogBreed" error={errors.dogBreed?.message} required>
              <Input id="dogBreed" {...register("dogBreed")} className={errors.dogBreed ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Dog's Age" htmlFor="dogAge" error={errors.dogAge?.message} required>
              <Input id="dogAge" {...register("dogAge")} className={errors.dogAge ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Dog's Sex" htmlFor="dogSex" error={errors.dogSex?.message} required>
              <Controller
                name="dogSex"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Male" id="sexMale" /><Label htmlFor="sexMale">Male</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Female" id="sexFemale" /><Label htmlFor="sexFemale">Female</Label></div>
                  </RadioGroup>
                )}
              />
            </FormField>
            <FormField label="Is your dog neutered?" htmlFor="dogNeutered" error={errors.dogNeutered?.message} required>
              <Controller
                name="dogNeutered"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="neuteredYes" /><Label htmlFor="neuteredYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="neuteredNo" /><Label htmlFor="neuteredNo">No</Label></div>
                  </RadioGroup>
                )}
              />
            </FormField>
            <FormField label="Where did you get your dog from?" htmlFor="dogOrigin" error={errors.dogOrigin?.message} required>
              <Controller
                name="dogOrigin"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Breeder" id="originBreeder" /><Label htmlFor="originBreeder">Breeder</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Rescue (UK)" id="originRescueUK" /><Label htmlFor="originRescueUK">Rescue (UK)</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Rescue (Abroad)" id="originRescueAbroad" /><Label htmlFor="originRescueAbroad">Rescue (Abroad)</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Other" id="originOther" /><Label htmlFor="originOther">Other</Label></div>
                  </RadioGroup>
                )}
              />
            </FormField>
            {watchDogOrigin === 'Other' && (
              <FormField label="If Other, please specify:" htmlFor="dogOriginOther" error={errors.dogOriginOther?.message} required>
                <Input id="dogOriginOther" {...register("dogOriginOther")} className={errors.dogOriginOther ? "border-destructive" : ""} disabled={isSubmitting} />
              </FormField>
            )}
            <FormField label="How long have you had your dog?" htmlFor="dogAcquisitionDuration" error={errors.dogAcquisitionDuration?.message} required>
              <Input id="dogAcquisitionDuration" {...register("dogAcquisitionDuration")} className={errors.dogAcquisitionDuration ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>

            <FormField label="Does your dog live with other dogs?" htmlFor="livesWithOtherDogs" error={errors.livesWithOtherDogs?.message} required>
               <Controller name="livesWithOtherDogs" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="dogsYes" /><Label htmlFor="dogsYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="dogsNo" /><Label htmlFor="dogsNo">No</Label></div>
                  </RadioGroup> )} />
            </FormField>
            {watchLivesWithOtherDogs === 'Yes' && (
              <FormField label="If yes, please provide their age(s), sex(s) and breed(s):" htmlFor="otherDogsDetails" error={errors.otherDogsDetails?.message} required>
                <Textarea id="otherDogsDetails" {...register("otherDogsDetails")} className={errors.otherDogsDetails ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
              </FormField>
            )}
             <FormField label="Does your dog live with cats?" htmlFor="livesWithCats" error={errors.livesWithCats?.message} required>
               <Controller name="livesWithCats" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="catsYes" /><Label htmlFor="catsYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="catsNo" /><Label htmlFor="catsNo">No</Label></div>
                  </RadioGroup> )} />
            </FormField>
            {watchLivesWithCats === 'Yes' && (
              <FormField label="If yes, please provide their age(s) and sex(s):" htmlFor="catsDetails" error={errors.catsDetails?.message} required>
                <Textarea id="catsDetails" {...register("catsDetails")} className={errors.catsDetails ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
              </FormField>
            )}
            <FormField label="Does your dog live with children?" htmlFor="livesWithChildren" error={errors.livesWithChildren?.message} required>
               <Controller name="livesWithChildren" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="childrenYes" /><Label htmlFor="childrenYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="childrenNo" /><Label htmlFor="childrenNo">No</Label></div>
                  </RadioGroup> )} />
            </FormField>
            {watchLivesWithChildren === 'Yes' && (
              <FormField label="If yes, please provide their age(s):" htmlFor="childrenDetails" error={errors.childrenDetails?.message} required>
                <Textarea id="childrenDetails" {...register("childrenDetails")} className={errors.childrenDetails ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
              </FormField>
            )}
            <FormField label="Are there any visiting children?" htmlFor="visitingChildren" error={errors.visitingChildren?.message} required>
               <Controller name="visitingChildren" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="visitingChildrenYes" /><Label htmlFor="visitingChildrenYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="visitingChildrenNo" /><Label htmlFor="visitingChildrenNo">No</Label></div>
                  </RadioGroup> )} />
            </FormField>
            {watchVisitingChildren === 'Yes' && (
              <FormField label="If yes, please provide their age(s) and frequency of visits:" htmlFor="visitingChildrenDetails" error={errors.visitingChildrenDetails?.message} required>
                <Textarea id="visitingChildrenDetails" {...register("visitingChildrenDetails")} className={errors.visitingChildrenDetails ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
              </FormField>
            )}
            <FormField label="Who else lives in the household? (e.g. partner, elderly relative)" htmlFor="otherHouseholdMembers" error={errors.otherHouseholdMembers?.message}>
              <Input id="otherHouseholdMembers" {...register("otherHouseholdMembers")} disabled={isSubmitting} />
            </FormField>

            <SectionTitle title="Behavioural Information" />
            <FormField label="Please describe in detail the behavioural problem(s) you are experiencing." htmlFor="behaviouralProblemsDescription" error={errors.behaviouralProblemsDescription?.message} required>
              <Textarea id="behaviouralProblemsDescription" {...register("behaviouralProblemsDescription")} className={errors.behaviouralProblemsDescription ? "border-destructive" : ""} disabled={isSubmitting} rows={5} />
            </FormField>
            <FormField label="When did the problem behaviour(s) start?" htmlFor="problemStartDate" error={errors.problemStartDate?.message} required>
              <Input id="problemStartDate" {...register("problemStartDate")} className={errors.problemStartDate ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="How often does the problem behaviour(s) occur? (e.g. daily, weekly, x times per walk)" htmlFor="problemFrequency" error={errors.problemFrequency?.message} required>
              <Input id="problemFrequency" {...register("problemFrequency")} className={errors.problemFrequency ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="In what situations does the behaviour occur? (e.g. on walks, in the home, when visitors arrive)" htmlFor="problemSituations" error={errors.problemSituations?.message} required>
              <Textarea id="problemSituations" {...register("problemSituations")} className={errors.problemSituations ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
            </FormField>
            <FormField label="Are there any triggers for the behaviour? (e.g. loud noises, other dogs, specific people)" htmlFor="problemTriggers" error={errors.problemTriggers?.message}>
              <Textarea id="problemTriggers" {...register("problemTriggers")} disabled={isSubmitting} rows={3} />
            </FormField>
            <FormField label="What have you tried so far to address the behaviour? (e.g. training classes, advice from friends)" htmlFor="previousSolutions" error={errors.previousSolutions?.message}>
              <Textarea id="previousSolutions" {...register("previousSolutions")} disabled={isSubmitting} rows={3} />
            </FormField>
            <FormField label="Has your dog shown any aggression? (e.g. growling, snapping, biting)" htmlFor="dogAggression" error={errors.dogAggression?.message} required>
              <Controller name="dogAggression" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="aggressionYes" /><Label htmlFor="aggressionYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="aggressionNo" /><Label htmlFor="aggressionNo">No</Label></div>
                  </RadioGroup> )} />
            </FormField>
            {watchDogAggression === 'Yes' && (
              <FormField label="If yes, please describe the incidents, including who or what was targeted and the severity." htmlFor="dogAggressionDetails" error={errors.dogAggressionDetails?.message} required>
                <Textarea id="dogAggressionDetails" {...register("dogAggressionDetails")} className={errors.dogAggressionDetails ? "border-destructive" : ""} disabled={isSubmitting} rows={4} />
              </FormField>
            )}
            <FormField label="What are your goals for your dog's behaviour? What would you like to achieve?" htmlFor="trainingGoals" error={errors.trainingGoals?.message} required>
              <Textarea id="trainingGoals" {...register("trainingGoals")} className={errors.trainingGoals ? "border-destructive" : ""} disabled={isSubmitting} rows={4} />
            </FormField>

            <SectionTitle title="Health & Lifestyle" />
            <FormField label="Please describe your dog's daily routine (e.g. walks, feeding times, playtime)." htmlFor="dailyRoutine" error={errors.dailyRoutine?.message} required>
              <Textarea id="dailyRoutine" {...register("dailyRoutine")} className={errors.dailyRoutine ? "border-destructive" : ""} disabled={isSubmitting} rows={4} />
            </FormField>
            <FormField label="How much exercise does your dog get per day?" htmlFor="dailyExercise" error={errors.dailyExercise?.message} required>
              <Input id="dailyExercise" {...register("dailyExercise")} className={errors.dailyExercise ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="What type of exercise does your dog get? (e.g. lead walks, off-lead runs, fetch)" htmlFor="exerciseType" error={errors.exerciseType?.message} required>
              <Input id="exerciseType" {...register("exerciseType")} className={errors.exerciseType ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="What type of food is your dog fed? (e.g. kibble, raw, wet)" htmlFor="dogFoodType" error={errors.dogFoodType?.message} required>
              <Input id="dogFoodType" {...register("dogFoodType")} className={errors.dogFoodType ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <FormField label="Does your dog have any known health problems or allergies?" htmlFor="healthProblemsAllergies" error={errors.healthProblemsAllergies?.message}>
              <Textarea id="healthProblemsAllergies" {...register("healthProblemsAllergies")} disabled={isSubmitting} rows={3} />
            </FormField>
            <FormField label="When was your dog's last vet check?" htmlFor="lastVetCheck" error={errors.lastVetCheck?.message}>
              <Input id="lastVetCheck" {...register("lastVetCheck")} disabled={isSubmitting} />
            </FormField>
            <FormField label="Are they currently on any medication?" htmlFor="currentMedication" error={errors.currentMedication?.message}>
              <Textarea id="currentMedication" {...register("currentMedication")} disabled={isSubmitting} rows={2} />
            </FormField>
            <FormField label="Has your dog had any past injuries or surgeries?" htmlFor="pastInjuriesSurgeries" error={errors.pastInjuriesSurgeries?.message}>
              <Textarea id="pastInjuriesSurgeries" {...register("pastInjuriesSurgeries")} disabled={isSubmitting} rows={2} />
            </FormField>

            <SectionTitle title="Training & Socialisation" />
            <FormField label="Has your dog attended any training classes?" htmlFor="attendedTrainingClasses" error={errors.attendedTrainingClasses?.message} required>
               <Controller name="attendedTrainingClasses" control={control} render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="trainingYes" /><Label htmlFor="trainingYes">Yes</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="trainingNo" /><Label htmlFor="trainingNo">No</Label></div>
                  </RadioGroup> )} />
            </FormField>
            {watchAttendedTrainingClasses === 'Yes' && (
              <FormField label="If yes, please describe the type of training and your experience." htmlFor="trainingClassesDetails" error={errors.trainingClassesDetails?.message} required>
                <Textarea id="trainingClassesDetails" {...register("trainingClassesDetails")} className={errors.trainingClassesDetails ? "border-destructive" : ""} disabled={isSubmitting} rows={3} />
              </FormField>
            )}
            <FormField label="How would you describe your dog's socialisation experiences with other dogs?" htmlFor="socialisationWithDogs" error={errors.socialisationWithDogs?.message}>
              <Textarea id="socialisationWithDogs" {...register("socialisationWithDogs")} disabled={isSubmitting} rows={3} />
            </FormField>
            <FormField label="How would you describe your dog's socialisation experiences with people?" htmlFor="socialisationWithPeople" error={errors.socialisationWithPeople?.message}>
              <Textarea id="socialisationWithPeople" {...register("socialisationWithPeople")} disabled={isSubmitting} rows={3} />
            </FormField>

            <SectionTitle title="Consent & Agreement" />
            <FormField label="" htmlFor="vetConsent" error={errors.vetConsent?.message} required>
                <div className="flex items-start space-x-2">
                    <Controller name="vetConsent" control={control} render={({ field }) => <Checkbox id="vetConsent" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />} />
                    <Label htmlFor="vetConsent" className="font-normal">I consent to Raising My Rescue contacting my vet if necessary.</Label>
                </div>
            </FormField>
             <FormField label="" htmlFor="commitmentConsent" error={errors.commitmentConsent?.message} required>
                <div className="flex items-start space-x-2">
                    <Controller name="commitmentConsent" control={control} render={({ field }) => <Checkbox id="commitmentConsent" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />} />
                    <Label htmlFor="commitmentConsent" className="font-normal">I understand that behavioural change takes time, consistency, and commitment.</Label>
                </div>
            </FormField>
            <FormField label="" htmlFor="termsConsent" error={errors.termsConsent?.message} required>
                <div className="flex items-start space-x-2">
                    <Controller name="termsConsent" control={control} render={({ field }) => <Checkbox id="termsConsent" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />} />
                    <Label htmlFor="termsConsent" className="font-normal">
                        I agree to the <Link href="/terms-and-conditions" target="_blank" className="underline text-primary hover:text-primary/80">terms and conditions</Link>.
                    </Label>
                </div>
            </FormField>
            <FormField label="Please type your full name to sign this form." htmlFor="signature" error={errors.signature?.message} required>
              <Input id="signature" {...register("signature")} className={errors.signature ? "border-destructive" : ""} disabled={isSubmitting} />
            </FormField>
            <input type="hidden" {...register("submissionDate")} />
             <div className="text-sm text-muted-foreground">
                Date of Submission: {format(new Date(), 'PPP p')}
            </div>


            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Behavioural Brief
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
